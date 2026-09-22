import { Button } from "@dingdongdash/ui/components/button";

export type FriendRelationship =
	| "me"
	| "friend"
	| "incoming"
	| "outgoing"
	| "blocked"
	| "none";

/**
 * Relationship-aware friend action: Add / Accept / Pending / Friends badge.
 * Renders nothing for yourself and for blocked relationships.
 */
export function FriendActionButton({
	accepting,
	incomingFriendshipId,
	onAccept,
	onSend,
	relationship,
	sending,
}: {
	accepting?: boolean;
	incomingFriendshipId?: string | null;
	onAccept: () => void;
	onSend: () => void;
	relationship: FriendRelationship;
	sending?: boolean;
}) {
	switch (relationship) {
		case "me":
			return null;
		case "friend":
			return (
				<span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
					Friends
				</span>
			);
		case "incoming":
			return (
				<Button
					disabled={accepting || !incomingFriendshipId}
					onClick={onAccept}
					size="sm"
				>
					Accept
				</Button>
			);
		case "outgoing":
			return (
				<Button disabled size="sm" variant="outline">
					Pending
				</Button>
			);
		case "blocked":
			return null;
		default:
			return (
				<Button disabled={sending} onClick={onSend} size="sm">
					Add
				</Button>
			);
	}
}
