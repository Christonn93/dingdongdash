import type { Database } from "@dingdongdash/db";
import { user } from "@dingdongdash/db/schema";
import { and, eq, isNull, lt, or } from "drizzle-orm";

const LAST_LOGIN_THROTTLE_MS = 60 * 60 * 1000;

/** Bumps a user's lastLoginAt at most once an hour, so returning sessions keep
 * it fresh without a write on every single request. The daily-login reward and
 * streak system reads this to know how recently the user was active. */
export async function touchLastLogin(
	db: Database,
	userId: string
): Promise<void> {
	const throttleBefore = new Date(Date.now() - LAST_LOGIN_THROTTLE_MS);
	await db
		.update(user)
		.set({ lastLoginAt: new Date() })
		.where(
			and(
				eq(user.id, userId),
				or(isNull(user.lastLoginAt), lt(user.lastLoginAt, throttleBefore))
			)
		);
}
