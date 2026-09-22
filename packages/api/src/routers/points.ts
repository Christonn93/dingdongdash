import { LEDGER_PAGE_SIZE } from "@dingdongdash/db/game";
import { pointsLedger, user } from "@dingdongdash/db/schema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt, or } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const pointsRouter = router({
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
