import type { Database } from "@dingdongdash/db";
import {
	CONTACT_IMPORT_MAX_HASHES,
	INVITE_TTL_MS,
	MAX_INVITES_PER_DAY,
} from "@dingdongdash/db/game";
import { friendship, invite, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, count, eq, gt, inArray, ne, or, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { generateInviteCode } from "../lib/invites";

const friendColumns = {
	email: user.email,
	id: user.id,
	image: user.image,
	name: user.name,
	points: user.points,
} as const;

export const friendsRouter = router({
	acceptInvite: protectedProcedure
		.input(z.object({ code: z.string().min(4).max(24) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const me = session.user.id;

			const [row] = await db
				.select()
				.from(invite)
				.where(eq(invite.code, input.code))
				.limit(1);
			if (!row) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Invalid invite link",
				});
			}
			if (new Date(row.expiresAt).getTime() < Date.now()) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "This invite has expired",
				});
			}
			if (row.userId === me) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You can't accept your own invite",
				});
			}

			await ensurePair(db, row.userId, me, "pending");
			const existing = await getPair(db, row.userId, me);
			if (existing.some((r) => r.status === "blocked")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "This friendship is blocked",
				});
			}
			await setPairStatus(db, row.userId, me, "accepted");

			await db
				.update(invite)
				.set({ usedCount: sql`${invite.usedCount} + 1` })
				.where(eq(invite.code, input.code));

			const [friend] = await db
				.select(friendColumns)
				.from(user)
				.where(eq(user.id, row.userId))
				.limit(1);

			return { friend: friend ?? null };
		}),
	acceptRequest: protectedProcedure
		.input(z.object({ friendshipId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const { id: me } = session.user;

			const incoming = await db
				.select()
				.from(friendship)
				.where(
					and(
						eq(friendship.id, input.friendshipId),
						eq(friendship.friendId, me),
						eq(friendship.status, "pending")
					)
				)
				.limit(1);
			const [request] = incoming;
			if (!request) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Request not found",
				});
			}

			await setPairStatus(db, request.userId, me, "accepted");
			return { accepted: true };
		}),

	block: protectedProcedure
		.input(z.object({ targetUserId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const { id: me } = session.user;

			if (input.targetUserId === me) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot block yourself",
				});
			}

			const target = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, input.targetUserId))
				.limit(1);
			if (target.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}

			await ensurePair(db, me, input.targetUserId, "blocked");
			await setPairStatus(db, me, input.targetUserId, "blocked");
			return { blocked: true };
		}),

	createInvite: protectedProcedure.mutation(async ({ ctx }) => {
		const { db, session } = ctx;
		const me = session.user.id;

		const [todayRow] = await db
			.select({ count: count() })
			.from(invite)
			.where(
				and(
					eq(invite.userId, me),
					gt(invite.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
				)
			);
		if ((todayRow?.count ?? 0) >= MAX_INVITES_PER_DAY) {
			throw new TRPCError({
				code: "TOO_MANY_REQUESTS",
				message: "You've created too many invites today.",
			});
		}

		const code = generateInviteCode();
		await db.insert(invite).values({
			code,
			expiresAt: new Date(Date.now() + INVITE_TTL_MS),
			userId: me,
		});

		return { code };
	}),

	getInviter: protectedProcedure
		.input(z.object({ code: z.string().min(4).max(24) }))
		.query(async ({ ctx, input }) => {
			const [row] = await ctx.db
				.select()
				.from(invite)
				.where(eq(invite.code, input.code))
				.limit(1);
			if (!row || new Date(row.expiresAt).getTime() < Date.now()) {
				return { name: null };
			}
			const [inviter] = await ctx.db
				.select({ name: user.name })
				.from(user)
				.where(eq(user.id, row.userId))
				.limit(1);
			return { name: inviter?.name ?? null };
		}),

	importContacts: protectedProcedure
		.input(
			z.object({
				hashes: z
					.array(z.string().regex(/^[0-9a-f]{64}$/))
					.max(CONTACT_IMPORT_MAX_HASHES),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const { id: me } = session.user;

			if (input.hashes.length === 0) {
				return { accepted: 0, matched: [] };
			}

			const matches = await db
				.select(friendColumns)
				.from(user)
				.where(and(inArray(user.phoneHash, input.hashes), ne(user.id, me)));

			const results = await Promise.all(
				matches.map(async (match) => {
					await ensurePair(db, me, match.id, "pending");
					const pair = await getPair(db, me, match.id);
					if (
						pair.length === 2 &&
						pair.every((row) => row.status === "pending")
					) {
						await setPairStatus(db, me, match.id, "accepted");
						return true;
					}
					return false;
				})
			);
			const acceptedCount = results.filter(Boolean).length;

			return { accepted: acceptedCount, matched: matches };
		}),
	list: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const { id: me } = session.user;

		const accepted = await db
			.select({
				createdAt: friendship.createdAt,
				friend: friendColumns,
				friendshipId: friendship.id,
				muted: friendship.muted,
			})
			.from(friendship)
			.innerJoin(user, eq(friendship.friendId, user.id))
			.where(and(eq(friendship.userId, me), eq(friendship.status, "accepted")));

		const incoming = await db
			.select({
				createdAt: friendship.createdAt,
				friendshipId: friendship.id,
				requester: friendColumns,
			})
			.from(friendship)
			.innerJoin(user, eq(friendship.userId, user.id))
			.where(
				and(eq(friendship.friendId, me), eq(friendship.status, "pending"))
			);

		const outgoing = await db
			.select({
				createdAt: friendship.createdAt,
				friend: friendColumns,
				friendshipId: friendship.id,
			})
			.from(friendship)
			.innerJoin(user, eq(friendship.friendId, user.id))
			.where(and(eq(friendship.userId, me), eq(friendship.status, "pending")));

		return { accepted, incoming, outgoing };
	}),

	sendRequest: protectedProcedure
		.input(z.object({ targetUserId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const { id: me } = session.user;

			if (input.targetUserId === me) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You cannot friend yourself",
				});
			}

			const target = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, input.targetUserId))
				.limit(1);
			if (target.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}

			const existing = await getPair(db, me, input.targetUserId);
			if (existing.some((row) => row.status === "blocked")) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Friendship is blocked",
				});
			}
			const acceptedRow = existing.find((row) => row.status === "accepted");
			if (acceptedRow) {
				return { friendshipId: acceptedRow.id };
			}

			await ensurePair(db, me, input.targetUserId, "pending");
			const rows = await getPair(db, me, input.targetUserId);
			return { friendshipId: rows[0]?.id };
		}),

	setMuted: protectedProcedure
		.input(z.object({ muted: z.boolean(), targetUserId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const { db, session } = ctx;
			await db
				.update(friendship)
				.set({ muted: input.muted })
				.where(
					and(
						eq(friendship.userId, session.user.id),
						eq(friendship.friendId, input.targetUserId)
					)
				);
			return { muted: input.muted };
		}),
});

async function ensurePair(
	db: Database,
	userIdA: string,
	userIdB: string,
	status: "pending" | "blocked"
) {
	await db
		.insert(friendship)
		.values([
			{ friendId: userIdB, id: crypto.randomUUID(), status, userId: userIdA },
			{ friendId: userIdA, id: crypto.randomUUID(), status, userId: userIdB },
		])
		.onConflictDoNothing();
}

function getPair(db: Database, userIdA: string, userIdB: string) {
	return db
		.select()
		.from(friendship)
		.where(
			or(
				and(eq(friendship.userId, userIdA), eq(friendship.friendId, userIdB)),
				and(eq(friendship.userId, userIdB), eq(friendship.friendId, userIdA))
			)
		);
}

async function setPairStatus(
	db: Database,
	userIdA: string,
	userIdB: string,
	status: "pending" | "accepted" | "blocked"
) {
	await db
		.update(friendship)
		.set({ status })
		.where(
			or(
				and(eq(friendship.userId, userIdA), eq(friendship.friendId, userIdB)),
				and(eq(friendship.userId, userIdB), eq(friendship.friendId, userIdA))
			)
		);
}
