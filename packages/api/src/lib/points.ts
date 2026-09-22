import type { Database } from "@dingdongdash/db";
import { pointsLedger, user } from "@dingdongdash/db/schema";
import { eq, sql } from "drizzle-orm";

export type LedgerReason =
	| "signup_bonus"
	| "catch"
	| "ditch_penalty"
	| "ditch_ring_penalty"
	| "purchase"
	| "adjustment";

/** Append an immutable ledger entry and keep the User.points cache in sync.
 * Both writes run in one D1 batch so they apply atomically. */
export async function applyPoints(
	db: Database,
	userId: string,
	amount: number,
	reason: LedgerReason,
	ringId: string | null = null
): Promise<void> {
	await db.batch([
		db.insert(pointsLedger).values({
			amount,
			id: crypto.randomUUID(),
			reason,
			ringId,
			userId,
		}),
		db
			.update(user)
			.set({ points: sql`${user.points} + ${amount}` })
			.where(eq(user.id, userId)),
	]);
}
