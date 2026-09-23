import type { Database } from "@dingdongdash/db";
import {
	CATCH_PENALTY,
	CATCH_REWARD,
	DAILY_LOSS_FLOOR,
	DITCH_PENALTY,
} from "@dingdongdash/db/game";
import { pointsLedger, ring, user } from "@dingdongdash/db/schema";
import { and, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

export type Ring = typeof ring.$inferSelect;

/** Result of attempting to resolve one ring. `applied` is false when the ring
 * was already resolved by another request (the CAS update matched 0 rows).
 * `deltas` are the point changes actually written to the ledger — zero when the
 * daily-loss floor capped a penalty to nothing. */
export interface RingResolution {
	applied: boolean;
	deltas: {
		ringer: number;
		target: number;
	};
}

const NOT_APPLIED: RingResolution = {
	applied: false,
	deltas: { ringer: 0, target: 0 },
};

/** True when a pending ring has already passed its authoritative expiry. */
export function isExpired(ringRow: Ring, now = Date.now()): boolean {
	return now > new Date(ringRow.expiresAt).getTime();
}

/** Loss the user can still take before hitting the rolling 24h floor.
 * Read just before the atomic batch that applies the penalty; D1 serializes
 * writes, so the window for two concurrent penalties to overshoot is tiny. */
async function cappedLoss(
	db: Database,
	userId: string,
	maxPenalty: number
): Promise<number> {
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const rows = await db
		.select({ amount: pointsLedger.amount })
		.from(pointsLedger)
		.where(
			and(
				eq(pointsLedger.userId, userId),
				gt(pointsLedger.createdAt, since),
				inArray(pointsLedger.reason, ["ditch_penalty", "ditch_ring_penalty"])
			)
		);
	const netLoss = rows.reduce((sum, row) => sum + row.amount, 0);
	const room = netLoss - DAILY_LOSS_FLOOR;
	return Math.max(0, Math.min(maxPenalty, room));
}

/**
 * Resolve a caught ring: target +CATCH_REWARD, ringer −CATCH_PENALTY (capped
 * by the daily-loss floor so a spam-ringed friend can't be drained). The ring
 * UPDATE is a compare-and-swap on `status = 'pending'`, so only the first
 * request to reach it applies points — a concurrent reconcile or answer can
 * never double-pay. Ledger inserts are deduped by the (ring_id, user_id)
 * unique index, and the ledger + cache writes land in one atomic D1 batch.
 */
export async function applyCatchCore(
	db: Database,
	ringRow: Ring
): Promise<RingResolution> {
	const claimed = await db
		.update(ring)
		.set({ resolvedAt: new Date(), status: "caught" })
		.where(and(eq(ring.id, ringRow.id), eq(ring.status, "pending")))
		.returning({ id: ring.id });
	if (claimed.length === 0) {
		return NOT_APPLIED;
	}

	const ringerPenalty = await cappedLoss(db, ringRow.ringerId, CATCH_PENALTY);
	const targetDelta = CATCH_REWARD;
	const ringerDelta = -ringerPenalty;

	const writes: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [
		db.insert(pointsLedger).values({
			amount: targetDelta,
			id: crypto.randomUUID(),
			reason: "catch",
			ringId: ringRow.id,
			userId: ringRow.targetId,
		}),
		db
			.update(user)
			.set({ points: sql`${user.points} + ${targetDelta}` })
			.where(eq(user.id, ringRow.targetId)),
	];
	if (ringerPenalty > 0) {
		writes.push(
			db.insert(pointsLedger).values({
				amount: ringerDelta,
				id: crypto.randomUUID(),
				reason: "ditch_ring_penalty",
				ringId: ringRow.id,
				userId: ringRow.ringerId,
			}),
			db
				.update(user)
				.set({ points: sql`${user.points} - ${ringerPenalty}` })
				.where(eq(user.id, ringRow.ringerId))
		);
	}
	await db.batch(writes);

	return {
		applied: true,
		deltas: { ringer: ringerDelta, target: targetDelta },
	};
}

/**
 * Resolve a ditched ring: the ringer earns +CATCH_REWARD (they caught the
 * target napping), the target loses −DITCH_PENALTY capped by the daily-loss
 * floor. Same CAS + unique-index + atomic-batch guarantees as applyCatchCore.
 */
export async function applyDitchCore(
	db: Database,
	ringRow: Ring
): Promise<RingResolution> {
	const claimed = await db
		.update(ring)
		.set({ resolvedAt: new Date(), status: "ditched" })
		.where(and(eq(ring.id, ringRow.id), eq(ring.status, "pending")))
		.returning({ id: ring.id });
	if (claimed.length === 0) {
		return NOT_APPLIED;
	}

	const penalty = await cappedLoss(db, ringRow.targetId, DITCH_PENALTY);
	const ringerDelta = CATCH_REWARD;
	const targetDelta = -penalty;

	const writes: [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]] = [
		db.insert(pointsLedger).values({
			amount: ringerDelta,
			id: crypto.randomUUID(),
			reason: "ditch_reward",
			ringId: ringRow.id,
			userId: ringRow.ringerId,
		}),
		db
			.update(user)
			.set({ points: sql`${user.points} + ${ringerDelta}` })
			.where(eq(user.id, ringRow.ringerId)),
	];
	if (penalty > 0) {
		writes.push(
			db.insert(pointsLedger).values({
				amount: targetDelta,
				id: crypto.randomUUID(),
				reason: "ditch_penalty",
				ringId: ringRow.id,
				userId: ringRow.targetId,
			}),
			db
				.update(user)
				.set({ points: sql`${user.points} - ${penalty}` })
				.where(eq(user.id, ringRow.targetId))
		);
	}
	await db.batch(writes);

	return {
		applied: true,
		deltas: { ringer: ringerDelta, target: targetDelta },
	};
}

/** Resolve a caught ring. */
export function applyCatch(
	db: Database,
	ringRow: Ring
): Promise<RingResolution> {
	return applyCatchCore(db, ringRow);
}

/** Resolve a ditched ring. */
export function applyDitch(
	db: Database,
	ringRow: Ring
): Promise<RingResolution> {
	return applyDitchCore(db, ringRow);
}

/**
 * Resolve every expired pending ring involving a user, so reads always show
 * current state. Runs sequentially — each resolution CASes its own ring, so
 * the outcome is independent of order and no ring can resolve twice.
 */
export async function reconcileUserRings(
	db: Database,
	userId: string,
	now = Date.now()
): Promise<number> {
	const expired = await db
		.select()
		.from(ring)
		.where(
			and(
				eq(ring.status, "pending"),
				lt(ring.expiresAt, new Date(now)),
				or(eq(ring.ringerId, userId), eq(ring.targetId, userId))
			)
		);

	let resolved = 0;
	for (const ringRow of expired) {
		// biome-ignore lint/performance/noAwaitInLoops: resolutions are independent per ring; the CAS makes order irrelevant
		const result = await applyDitch(db, ringRow);
		if (result.applied) {
			resolved += 1;
		}
	}
	return resolved;
}
