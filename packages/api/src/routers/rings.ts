import type { Database } from "@dingdongdash/db";
import {
	RING_DURATION_MS,
	TIME_SHIELD_EXTENSION_MS,
} from "@dingdongdash/db/game";
import { friendship, ring, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, lt, or } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { notifyUser } from "../lib/notifications";
import { applyCatch, reconcileUserRings, resolveIfExpired } from "../lib/rings";

const RING_PAGE_SIZE = 20;

export const ringsRouter = router({
	answer: protectedProcedure
		.input(z.object({ ringId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const me = session.user.id;

			const [ringRow] = await db
				.select()
				.from(ring)
				.where(and(eq(ring.id, input.ringId), eq(ring.targetId, me)))
				.limit(1);
			if (!ringRow) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Ring not found" });
			}

			const status = await resolveIfExpired(db, ringRow);
			if (status === null) {
				await applyCatch(db, ringRow);
				await notifyUser(ctx, ringRow.ringerId, "caught", {
					body: "They opened the door in time. −5 points.",
					data: { outcome: "caught", ringId: ringRow.id, type: "ring_result" },
					title: "You got caught!",
				});
				return { outcome: "caught" as const, ring: ringRow };
			}
			if (status === "caught") {
				return { outcome: "caught" as const, ring: ringRow };
			}
			await notifyUser(ctx, me, "ditched", {
				body: "The timer ran out. −10 points.",
				data: { outcome: "ditched", ringId: ringRow.id, type: "ring_result" },
				title: "You were ditched",
			});
			return {
				outcome: "ditched" as const,
				ring: { ...ringRow, status: "ditched" },
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

			const shieldActive = target?.timeShieldArmed === true;
			const durationMs = shieldActive
				? RING_DURATION_MS + TIME_SHIELD_EXTENSION_MS
				: RING_DURATION_MS;

			const newRing: typeof ring.$inferInsert = {
				durationMs,
				expiresAt: new Date(now + durationMs),
				id: crypto.randomUUID(),
				ringerId: me,
				targetId: input.targetUserId,
			};
			await db.insert(ring).values(newRing);

			if (shieldActive) {
				await db
					.update(user)
					.set({ timeShieldArmed: false })
					.where(eq(user.id, input.targetUserId));
			}

			if (!muted) {
				await notifyUser(ctx, input.targetUserId, "ring", {
					body: "Someone's at your door. Answer within 30 seconds or they ditch you.",
					data: { ringId: newRing.id, type: "ring" },
					title: "The doorbell is ringing",
				});
			}

			return { ringId: newRing.id };
		}),

	getActive: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		await reconcileUserRings(db, session.user.id);

		const pending = await db
			.select({
				createdAt: ring.createdAt,
				durationMs: ring.durationMs,
				expiresAt: ring.expiresAt,
				id: ring.id,
				ringer: {
					avatarId: user.avatarId,
					id: user.id,
					image: user.image,
					name: user.name,
				},
				ringerId: ring.ringerId,
			})
			.from(ring)
			.innerJoin(user, eq(ring.ringerId, user.id))
			.where(
				and(eq(ring.targetId, session.user.id), eq(ring.status, "pending"))
			);

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

			return {
				entries: page,
				nextCursor: hasMore && last ? encodeCursor(last) : null,
			};
		}),
});

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
