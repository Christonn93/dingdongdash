import type { Database } from "@dingdongdash/db";
import { friendship } from "@dingdongdash/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";

export type FriendRelationship =
	| "me"
	| "friend"
	| "incoming"
	| "outgoing"
	| "blocked"
	| "none";

export interface RelationshipInfo {
	incomingFriendshipId: string | null;
	relationship: FriendRelationship;
}

/**
 * Classify each user id by how they relate to `me`, using the dual-row
 * friendship model. A pending request is "incoming" only when the other user
 * initiated it (`requestedBy`); requests I sent show as "outgoing". Legacy
 * rows without a `requestedBy` fall back to the row's direction.
 * `incomingFriendshipId` is set only for incoming requests, so callers can
 * accept straight from a discovered row.
 */
export async function relationshipForUsers(
	db: Database,
	me: string,
	userIds: string[]
): Promise<Map<string, RelationshipInfo>> {
	const map = new Map<string, RelationshipInfo>();
	for (const id of userIds) {
		map.set(
			id,
			id === me
				? { incomingFriendshipId: null, relationship: "me" }
				: { incomingFriendshipId: null, relationship: "none" }
		);
	}

	if (userIds.length === 0) {
		return map;
	}

	const rows = await db
		.select()
		.from(friendship)
		.where(
			or(
				and(eq(friendship.userId, me), inArray(friendship.friendId, userIds)),
				and(inArray(friendship.userId, userIds), eq(friendship.friendId, me))
			)
		);

	for (const row of rows) {
		applyRow(map, row, me);
	}

	return map;
}

function applyRow(
	map: Map<string, RelationshipInfo>,
	row: typeof friendship.$inferSelect,
	me: string
) {
	const isMine = row.userId === me;
	const other = isMine ? row.friendId : row.userId;
	if (other === me || !map.has(other)) {
		return;
	}
	if (row.status === "accepted") {
		map.set(other, { incomingFriendshipId: null, relationship: "friend" });
		return;
	}
	if (row.status === "blocked") {
		map.set(other, { incomingFriendshipId: null, relationship: "blocked" });
		return;
	}
	const fromMe = row.requestedBy === me || (row.requestedBy === null && isMine);
	if (fromMe) {
		if (map.get(other)?.relationship === "none") {
			map.set(other, {
				incomingFriendshipId: null,
				relationship: "outgoing",
			});
		}
	} else {
		map.set(other, {
			incomingFriendshipId: row.id,
			relationship: "incoming",
		});
	}
}
