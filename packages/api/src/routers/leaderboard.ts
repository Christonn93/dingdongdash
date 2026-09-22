import { friendship, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, gte, lt, lte, ne, or, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { relationshipForUsers } from "../lib/relationships";

const PAGE_SIZE = 25;

const leaderboardScope = z.enum(["all", "area", "score"]).default("all");

const leaderboardColumns = {
	avatarId: user.avatarId,
	id: user.id,
	image: user.image,
	name: user.name,
	points: user.points,
} as const;

export const leaderboardRouter = router({
	getFriends: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const me = session.user.id;

		const friendRows = await db
			.select(leaderboardColumns)
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
			.select(leaderboardColumns)
			.from(user)
			.where(eq(user.id, me))
			.limit(1);
		if (!myRow) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}

		const ranked = [...friendRows, myRow]
			.sort((a, b) => b.points - a.points || a.id.localeCompare(b.id))
			.map((row, index) => ({
				...row,
				incomingFriendshipId: null,
				rank: index + 1,
				relationship: row.id === me ? "me" : "friend",
			}));

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
				scope: leaderboardScope,
			})
		)
		.query(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const me = session.user.id;
			const myPoints = (await mePoints(db, me)) ?? 0;

			if (input.scope === "area" && !ctx.areaCity && !ctx.areaCountry) {
				return {
					entries: [],
					nextCursor: null,
					region: { city: ctx.areaCity, country: ctx.areaCountry },
				};
			}

			const conditions = buildScopeConditions({
				myCity: ctx.areaCity,
				myCountry: ctx.areaCountry,
				myPoints,
				scope: input.scope,
				userId: me,
			});

			const rows = await db
				.select(leaderboardColumns)
				.from(user)
				.where(and(...conditions))
				.orderBy(desc(user.points), asc(user.id))
				.offset(input.cursor)
				.limit(input.limit + 1);

			const hasMore = rows.length > input.limit;
			const page = rows.slice(0, input.limit);

			const relationships = await relationshipForUsers(
				db,
				me,
				page.map((row) => row.id)
			);

			return {
				entries: page.map((row, index) => {
					const rel = relationships.get(row.id);
					return {
						...row,
						incomingFriendshipId: rel?.incomingFriendshipId ?? null,
						rank: input.cursor + index + 1,
						relationship: rel?.relationship ?? "none",
					};
				}),
				nextCursor: hasMore ? input.cursor + page.length : null,
				region: { city: ctx.areaCity, country: ctx.areaCountry },
			};
		}),
});

async function mePoints(
	db: Parameters<typeof relationshipForUsers>[0],
	me: string
) {
	const [row] = await db
		.select({ points: user.points })
		.from(user)
		.where(eq(user.id, me))
		.limit(1);
	return row?.points;
}

function buildScopeConditions({
	myCity,
	myCountry,
	myPoints,
	scope,
	userId,
}: {
	myCity: string | null;
	myCountry: string | null;
	myPoints: number;
	scope: "all" | "area" | "score";
	userId: string;
}) {
	if (scope === "area") {
		// Prefer city-level matching; fall back to country when I have no city.
		const city = myCity;
		if (city) {
			return [and(eq(user.areaCity, city), ne(user.id, userId))];
		}
		const country = myCountry;
		return country
			? [and(eq(user.areaCountry, country), ne(user.id, userId))]
			: [sql`0`];
	}
	if (scope === "score") {
		return [
			and(
				ne(user.id, userId),
				gte(user.points, Math.floor(myPoints * 0.75)),
				lte(user.points, Math.ceil(myPoints * 1.25))
			),
		];
	}
	return [ne(user.id, userId)];
}
