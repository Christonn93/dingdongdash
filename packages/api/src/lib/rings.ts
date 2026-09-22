import type { Database } from "@dingdongdash/db";
import {
	CATCH_PENALTY,
	CATCH_REWARD,
	DAILY_LOSS_FLOOR,
	DITCH_PENALTY,
} from "@dingdongdash/db/game";
import { pointsLedger, ring, user } from "@dingdongdash/db/schema";
import { and, eq, gt, inArray, lt, or, sql } from "drizzle-orm";

export type Ring = typeof ring.$inferSelect;

/** True when a pending ring has already passed its authoritative expiry. */
export function isExpired(ringRow: Ring, now = Date.now()): boolean {
	return now > new Date(ringRow.expiresAt).getTime();
}

/** Resolve a caught ring: target +10, ringer −5. Idempotent. */
export async function applyCatch(db: Database, ringRow: Ring): Promise<void> {
	if (ringRow.status !== "pending") {
		return;
	}
	await db.batch([
		db.insert(pointsLedger).values({
			amount: CATCH_REWARD,
			id: crypto.randomUUID(),
			reason: "catch",
			ringId: ringRow.id,
			userId: ringRow.targetId,
		}),
		db.insert(pointsLedger).values({
			amount: -CATCH_PENALTY,
			id: crypto.randomUUID(),
			reason: "ditch_ring_penalty",
			ringId: ringRow.id,
			userId: ringRow.ringerId,
		}),
		db
			.update(user)
			.set({ points: sql`${user.points} + ${CATCH_REWARD}` })
			.where(eq(user.id, ringRow.targetId)),
		db
			.update(user)
			.set({ points: sql`${user.points} - ${CATCH_PENALTY}` })
			.where(eq(user.id, ringRow.ringerId)),
		db
			.update(ring)
			.set({ resolvedAt: new Date(), status: "caught" })
			.where(eq(ring.id, ringRow.id)),
	]);
}

/** Resolve a ditched ring: target −10, capped by the daily loss floor so one
 * bad day (or a spam-ringing friend) can't tank a user's rank. Idempotent. */
export async function applyDitch(db: Database, ringRow: Ring): Promise<void> {
	if (ringRow.status !== "pending") {
		return;
	}
	const penalty = await cappedDitchPenalty(db, ringRow.targetId);
	await db.batch([
		db.insert(pointsLedger).values({
			amount: -penalty,
			id: crypto.randomUUID(),
			reason: "ditch_penalty",
			ringId: ringRow.id,
			userId: ringRow.targetId,
		}),
		db
			.update(user)
			.set({ points: sql`${user.points} - ${penalty}` })
			.where(eq(user.id, ringRow.targetId)),
		db
			.update(ring)
			.set({ resolvedAt: new Date(), status: "ditched" })
			.where(eq(ring.id, ringRow.id)),
	]);
}

/** Loss the user can still take before hitting the rolling 24h floor. */
async function cappedDitchPenalty(
	db: Database,
	userId: string
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
	return Math.max(0, Math.min(DITCH_PENALTY, room));
}

/** If the ring is pending and past expiry, resolve it as a ditch. Returns the
 * resulting status or null when no change was made. */
export async function resolveIfExpired(
	db: Database,
	ringRow: Ring,
	now = Date.now()
): Promise<Ring["status"] | null> {
	if (ringRow.status !== "pending") {
		return ringRow.status;
	}
	if (!isExpired(ringRow, now)) {
		return null;
	}
	await applyDitch(db, ringRow);
	return "ditched";
}

/** Resolve every expired pending ring involving a user, so reads always show
 * current state. Returns the number of rings resolved. */
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
	await Promise.all(expired.map((ringRow) => applyDitch(db, ringRow)));
	return expired.length;
}
