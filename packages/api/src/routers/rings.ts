import type { Database } from "@dingdongdash/db";
import {
	RING_DURATION_MS,
	TIME_SHIELD_EXTENSION_MS,
} from "@dingdongdash/db/game";
import { friendship, pointsLedger, ring, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, inArray, lt, or, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { notifyUser } from "../lib/notifications";
import {
	applyCatchCore,
	applyDitchCore,
	isExpired,
	reconcileUserRings,
} from "../lib/rings";

const RING_PAGE_SIZE = 20;

export const ringsRouter = router({
	answer: protectedProcedure
		.input(z.object({ ringId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const me = session.user.id;

			const [fresh] = await db
				.select()
				.from(ring)
				.where(eq(ring.id, input.ringId))
				.limit(1);
			if (!fresh || fresh.targetId !== me) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ring not found",
				});
			}

			if (fresh.status !== "pending") {
				return {
					deltas: { ringer: 0, target: 0 },
					outcome: fresh.status,
					ring: fresh,
				};
			}

			// The resolution functions CAS the ring from "pending", so a poll or
			// duplicate tap can't race a second payout — the winner applies
			// points exactly once, and the loser sees `applied: false`.
			const expired = isExpired(fresh);
			const outcome = expired ? "ditched" : "caught";
			const result = expired
				? await applyDitchCore(db, fresh)
				: await applyCatchCore(db, fresh);

			if (result.applied) {
				if (outcome === "caught") {
					await notifyUser(ctx, fresh.ringerId, "caught", {
						body: `They opened the door in time. ${formatDelta(result.deltas.ringer)} points.`,
						data: {
							outcome: "caught",
							ringId: fresh.id,
							type: "ring_result",
						},
						title: "You got caught!",
					});
				} else {
					await notifyUser(ctx, me, "ditched", {
						body: `The timer ran out. ${formatDelta(result.deltas.target)} points.`,
						data: {
							outcome: "ditched",
							ringId: fresh.id,
							type: "ring_result",
						},
						title: "You were ditched",
					});
				}
				return {
					deltas: result.deltas,
					outcome,
					ring: { ...fresh, status: outcome },
				};
			}

			// A concurrent poll already resolved this ring — report its true state.
			const [current] = await db
				.select()
				.from(ring)
				.where(eq(ring.id, input.ringId))
				.limit(1);
			return {
				deltas: { ringer: 0, target: 0 },
				outcome: current?.status ?? fresh.status,
				ring: current ?? fresh,
			};
		}),
	create: protectedProcedure
		.input(z.object({ targetUserId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const me = session.user.id;

			if (input.targetUserId === me) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot ring yourself",
				});
			}

			const isFriend = await isAcceptedFriend(db, me, input.targetUserId);
			if (!isFriend) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You can only ring mutual friends",
				});
			}

			// A friend can be rung repeatedly — but only once their current ring
			// has resolved. While a ring is pending (and not yet expired) they
			// still have the 30s (or 45s with a Time Shield) to answer.
			const pendingRings = await db
				.select({ id: ring.id })
				.from(ring)
				.where(
					and(
						eq(ring.ringerId, me),
						eq(ring.targetId, input.targetUserId),
						eq(ring.status, "pending"),
						gt(ring.expiresAt, new Date())
					)
				)
				.limit(1);
			if (pendingRings.length > 0) {
				throw new TRPCError({
					code: "TOO_MANY_REQUESTS",
					message:
						"They still have a ring at their door — wait for them to answer.",
				});
			}

			const now = Date.now();
			const [target] = await db
				.select({
					cameraDoorbell: user.cameraDoorbell,
					dndEnabled: user.dndEnabled,
					dndFrom: user.dndFrom,
					dndTo: user.dndTo,
					timeShieldArmed: user.timeShieldArmed,
				})
				.from(user)
				.where(eq(user.id, input.targetUserId))
				.limit(1);

			if (target && isInDndWindow(target, now)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This friend is on Do Not Disturb right now",
				});
			}

			const muted = await isMuted(db, input.targetUserId, me);

			// Claim the Time Shield with a conditional update so two simultaneous
			// rings can't both spend the same armed shield or extend twice. The
			// claim is a single atomic UPDATE; the ring insert follows.
			const shieldActive = target?.timeShieldArmed === true;
			const claimed = shieldActive
				? await db
						.update(user)
						.set({ timeShieldArmed: false })
						.where(
							and(
								eq(user.id, input.targetUserId),
								eq(user.timeShieldArmed, true)
							)
						)
						.returning({ id: user.id })
				: [];
			const shieldExtends = claimed.length > 0;
			const duration = shieldExtends
				? RING_DURATION_MS + TIME_SHIELD_EXTENSION_MS
				: RING_DURATION_MS;

			const newRing: typeof ring.$inferInsert = {
				durationMs: duration,
				expiresAt: new Date(now + duration),
				id: crypto.randomUUID(),
				ringerId: me,
				targetId: input.targetUserId,
			};
			await db.insert(ring).values(newRing);
			const ringId = newRing.id;

			if (!muted) {
				const revealRinger = target?.cameraDoorbell === true;
				const body = revealRinger
					? `${session.user.name} is at your door — answer within 30 seconds or they ditch you.`
					: "Someone's at your door. Answer within 30 seconds or they ditch you.";
				await notifyUser(ctx, input.targetUserId, "ring", {
					body,
					data: {
						anonymous: !revealRinger,
						ringId,
						type: "ring",
					},
					title: revealRinger
						? `${session.user.name} is at your door`
						: "The doorbell is ringing",
				});
			}

			return { ringId };
		}),

	getActive: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		await reconcileUserRings(db, session.user.id);

		// Without a camera doorbell, ringers stay anonymous: the target sees
		// "Someone is at your door" instead of the ringer's name and avatar.
		const [target] = await db
			.select({ cameraDoorbell: user.cameraDoorbell })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		const revealRinger = target?.cameraDoorbell === true;

		const base = {
			createdAt: ring.createdAt,
			durationMs: ring.durationMs,
			expiresAt: ring.expiresAt,
			id: ring.id,
			ringerId: ring.ringerId,
		};
		const where = and(
			eq(ring.targetId, session.user.id),
			eq(ring.status, "pending")
		);

		const pending = revealRinger
			? await db
					.select({
						...base,
						ringer: {
							avatarId: user.avatarId,
							id: user.id,
							image: user.image,
							name: user.name,
						},
					})
					.from(ring)
					.innerJoin(user, eq(ring.ringerId, user.id))
					.where(where)
			: await db
					.select({ ...base, ringer: sql<null>`null` })
					.from(ring)
					.where(where);

		return { rings: pending };
	}),

	getHistory: protectedProcedure
		.input(
			z.object({
				cursor: z.string().optional(),
				limit: z.number().int().min(1).max(50).default(RING_PAGE_SIZE),
			})
		)
		.query(async ({ ctx, input }) => {
			const { db, session } = ctx;
			await reconcileUserRings(db, session.user.id);

			const conditions = [
				or(
					eq(ring.ringerId, session.user.id),
					eq(ring.targetId, session.user.id)
				),
			].filter((c): c is NonNullable<typeof c> => c !== undefined);
			if (input.cursor) {
				const cursor = decodeCursor(input.cursor);
				const cursorDate = new Date(cursor.createdAt);
				const cursorCondition = or(
					lt(ring.createdAt, cursorDate),
					and(eq(ring.createdAt, cursorDate), lt(ring.id, cursor.id))
				);
				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const rows = await db
				.select({
					createdAt: ring.createdAt,
					durationMs: ring.durationMs,
					expiresAt: ring.expiresAt,
					id: ring.id,
					resolvedAt: ring.resolvedAt,
					ringerId: ring.ringerId,
					status: ring.status,
					targetId: ring.targetId,
				})
				.from(ring)
				.where(and(...conditions))
				.orderBy(desc(ring.createdAt), desc(ring.id))
				.limit(input.limit + 1);

			const hasMore = rows.length > input.limit;
			const page = rows.slice(0, input.limit);
			const last = page.at(-1);

			// Attach the requesting user's actual point delta per ring (summed
			// from the ledger) so the UI never hardcodes +10/−10.
			const deltaByRing = await pointsDeltaByRing(
				db,
				session.user.id,
				page.map((entry) => entry.id)
			);
			const entries = page.map((entry) => ({
				...entry,
				delta: deltaByRing.get(entry.id) ?? 0,
			}));

			return {
				entries,
				nextCursor: hasMore && last ? encodeCursor(last) : null,
			};
		}),
});

async function pointsDeltaByRing(
	db: Database,
	userId: string,
	ringIds: string[]
): Promise<Map<string, number>> {
	if (ringIds.length === 0) {
		return new Map();
	}
	const ledgerRows = await db
		.select({ amount: pointsLedger.amount, ringId: pointsLedger.ringId })
		.from(pointsLedger)
		.where(
			and(
				eq(pointsLedger.userId, userId),
				inArray(pointsLedger.ringId, ringIds)
			)
		);
	const deltaByRing = new Map<string, number>();
	for (const row of ledgerRows) {
		if (row.ringId) {
			deltaByRing.set(
				row.ringId,
				(deltaByRing.get(row.ringId) ?? 0) + row.amount
			);
		}
	}
	return deltaByRing;
}

function formatDelta(delta: number): string {
	return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

function isAcceptedFriend(
	db: Database,
	me: string,
	friendId: string
): Promise<boolean> {
	return db
		.select({ id: friendship.id })
		.from(friendship)
		.where(
			and(
				eq(friendship.status, "accepted"),
				or(
					and(eq(friendship.userId, me), eq(friendship.friendId, friendId)),
					and(eq(friendship.userId, friendId), eq(friendship.friendId, me))
				)
			)
		)
		.limit(1)
		.then((rows) => rows.length > 0);
}

/** True when `now` falls inside the target's configured Do Not Disturb window. */
function isInDndWindow(
	target: { dndEnabled: boolean; dndFrom: number; dndTo: number },
	now: number
): boolean {
	if (!target.dndEnabled) {
		return false;
	}
	const hour = new Date(now).getHours();
	const from = target.dndFrom;
	const to = target.dndTo;
	if (from === to) {
		return false;
	}
	if (from < to) {
		return hour >= from && hour < to;
	}
	return hour >= from || hour < to;
}

/** True when `muter` has muted `mutee` (muters don't get notification spam). */
async function isMuted(
	db: Database,
	muter: string,
	mutee: string
): Promise<boolean> {
	const rows = await db
		.select({ muted: friendship.muted })
		.from(friendship)
		.where(and(eq(friendship.userId, muter), eq(friendship.friendId, mutee)))
		.limit(1);
	return rows[0]?.muted === true;
}

interface Cursor {
	createdAt: number;
	id: string;
}

function encodeCursor(row: { createdAt: Date; id: string }): string {
	return Buffer.from(
		JSON.stringify({ createdAt: row.createdAt.getTime(), id: row.id }),
		"utf8"
	).toString("base64url");
}

function decodeCursor(cursor: string): Cursor {
	try {
		const raw = Buffer.from(cursor, "base64url").toString("utf8");
		const parsed = JSON.parse(raw) as Cursor;
		if (typeof parsed.createdAt !== "number" || typeof parsed.id !== "string") {
			throw new Error("invalid cursor shape");
		}
		return parsed;
	} catch (error) {
		// biome-ignore lint/style/useErrorCause: TRPCError options object already carries cause
		throw new TRPCError({
			cause: error,
			code: "BAD_REQUEST",
			message: "Invalid cursor",
		});
	}
}
