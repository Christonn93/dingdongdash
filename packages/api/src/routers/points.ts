import type { Database } from "@dingdongdash/db";
import {
	DAILY_BONUS_POINTS,
	LEDGER_PAGE_SIZE,
	STREAK_MILESTONE_BONUS,
} from "@dingdongdash/db/game";
import { pointsLedger, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const DAY_MS = 86_400_000;

function todayUtcKey(date = new Date()): string {
	return date.toISOString().slice(0, 10);
}

function utcDateFromKey(key: string): Date {
	return new Date(`${key}T00:00:00Z`);
}

function dayDiffDays(laterKey: string, earlierKey: string): number {
	const later = utcDateFromKey(laterKey).getTime();
	const earlier = utcDateFromKey(earlierKey).getTime();
	return Math.round((later - earlier) / DAY_MS);
}

/** All UTC claim dates for a user's daily bonuses, newest first. */
async function dailyBonusDates(
	db: Database,
	userId: string
): Promise<string[]> {
	const rows = await db
		.select({ createdAt: pointsLedger.createdAt })
		.from(pointsLedger)
		.where(
			and(
				eq(pointsLedger.userId, userId),
				eq(pointsLedger.reason, "daily_bonus")
			)
		)
		.orderBy(desc(pointsLedger.createdAt), desc(pointsLedger.id));
	return rows.map((row) => {
		const createdAt =
			row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
		return todayUtcKey(createdAt);
	});
}

/** Consecutive-day run ending at a given claim date. */
function runEndingAt(dates: string[], endKey: string): number {
	const set = new Set(dates);
	let streak = 0;
	const cursor = utcDateFromKey(endKey);
	while (set.has(todayUtcKey(cursor))) {
		streak += 1;
		cursor.setUTCDate(cursor.getUTCDate() - 1);
	}
	return streak;
}

/** Login streak that is still alive (last claim is today or yesterday), else 0. */
function aliveStreak(dates: string[]): number {
	const unique = [...new Set(dates)].sort().reverse();
	const last = unique[0];
	if (!last) {
		return 0;
	}
	if (dayDiffDays(todayUtcKey(), last) > 1) {
		return 0;
	}
	return runEndingAt(unique, last);
}

export const pointsRouter = router({
	claimDailyBonus: protectedProcedure.mutation(async ({ ctx }) => {
		const { db, session } = ctx;
		const dates = await dailyBonusDates(db, session.user.id);
		const today = todayUtcKey();

		if (dates.includes(today)) {
			return {
				granted: false,
				milestone: false,
				points: DAILY_BONUS_POINTS,
				streak: runEndingAt(dates, today),
			};
		}

		const streak = aliveStreak(dates) + 1;
		const milestone = streak % 7 === 0;
		const amount =
			DAILY_BONUS_POINTS + (milestone ? STREAK_MILESTONE_BONUS : 0);

		await db.batch([
			db.insert(pointsLedger).values({
				amount,
				id: crypto.randomUUID(),
				reason: "daily_bonus",
				userId: session.user.id,
			}),
			db
				.update(user)
				.set({ points: sql`${user.points} + ${amount}` })
				.where(eq(user.id, session.user.id)),
		]);

		return { granted: true, milestone, points: amount, streak };
	}),

	getBalance: protectedProcedure.query(async ({ ctx }) => {
		const { db, session } = ctx;
		const me = await db
			.select({ points: user.points })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);
		const [meRow] = me;
		if (!meRow) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
		}
		return { balance: meRow.points };
	}),
	getDailyBonusStatus: protectedProcedure.query(async ({ ctx }) => {
		const dates = await dailyBonusDates(ctx.db, ctx.session.user.id);
		const today = todayUtcKey();
		return {
			available: !dates.includes(today),
			points: DAILY_BONUS_POINTS,
			streak: aliveStreak(dates),
		};
	}),

	getLedger: protectedProcedure
		.input(
			z.object({
				cursor: z.string().optional(),
				limit: z.number().int().min(1).max(50).default(LEDGER_PAGE_SIZE),
			})
		)
		.query(async ({ ctx, input }) => {
			const { db, session } = ctx;
			const me = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.id, session.user.id))
				.limit(1);
			if (!me[0]) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}

			const conditions = [eq(pointsLedger.userId, session.user.id)];
			if (input.cursor) {
				const cursor = decodeCursor(input.cursor);
				const cursorDate = new Date(cursor.createdAt);
				const cursorCondition = or(
					lt(pointsLedger.createdAt, cursorDate),
					and(
						eq(pointsLedger.createdAt, cursorDate),
						lt(pointsLedger.id, cursor.id)
					)
				);
				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const entries = await db
				.select()
				.from(pointsLedger)
				.where(and(...conditions))
				.orderBy(desc(pointsLedger.createdAt), desc(pointsLedger.id))
				.limit(input.limit + 1);

			const hasMore = entries.length > input.limit;
			const page = entries.slice(0, input.limit);
			const last = page.at(-1);

			return {
				entries: page,
				nextCursor: hasMore && last ? encodeCursor(last) : null,
			};
		}),
});

interface Cursor {
	createdAt: number;
	id: string;
}

function encodeCursor(row: { createdAt: Date | number; id: string }): string {
	const createdAt =
		row.createdAt instanceof Date
			? row.createdAt.getTime()
			: Number(row.createdAt);
	return Buffer.from(
		JSON.stringify({ createdAt, id: row.id }),
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
