import { friendship, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, lt, ne, or, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const PAGE_SIZE = 25;

export const leaderboardRouter = router({
	getFriends: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const me = session.user.id;

		const friendRows = await db
			.select({
				avatarId: user.avatarId,
				id: user.id,
				image: user.image,
				name: user.name,
				points: user.points,
			})
			.from(friendship)
			.innerJoin(user, eq(friendship.friendId, user.id))
			.where(
				and(
					eq(friendship.userId, me),
					eq(friendship.status, "accepted"),
					ne(user.id, me)
				)
			)
			.orderBy(desc(user.points), asc(user.id));

		const [myRow] = await db
			.select({
				avatarId: user.avatarId,
				id: user.id,
				image: user.image,
				name: user.name,
				points: user.points,
			})
			.from(user)
			.where(eq(user.id, me))
			.limit(1);
		if (!myRow) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}

		const ranked = [...friendRows, myRow]
			.sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))
			.map((row, index) => ({ ...row, rank: index + 1 }));

		const meRank = ranked.find((row) => row.id === me)?.rank ?? null;

		const [myGlobal] = await ctx.db
			.select({ count: sql<number>`count(*)` })
			.from(user)
			.where(
				or(
					gt(user.points, myRow.points),
					and(eq(user.points, myRow.points), lt(user.id, myRow.id))
				)
			);

		return {
			entries: ranked,
			me: { ...myRow, globalRank: (myGlobal?.count ?? 0) + 1, rank: meRank },
		};
	}),
	getGlobal: protectedProcedure
		.input(
			z.object({
				cursor: z.number().int().min(0).default(0),
				limit: z.number().int().min(1).max(50).default(PAGE_SIZE),
			})
		)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					avatarId: user.avatarId,
					id: user.id,
					image: user.image,
					name: user.name,
					points: user.points,
				})
				.from(user)
				.orderBy(desc(user.points), asc(user.id))
				.offset(input.cursor)
				.limit(input.limit + 1);

			const hasMore = rows.length > input.limit;
			const page = rows.slice(0, input.limit);

			return {
				entries: page.map((row, index) => ({
					...row,
					rank: input.cursor + index + 1,
				})),
				nextCursor: hasMore ? input.cursor + page.length : null,
			};
		}),
});
