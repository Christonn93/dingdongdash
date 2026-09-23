import {
	DOOR_SKINS,
	type DoorSkinTheme,
} from "@dingdongdash/api/lib/door-catalog";
import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";

import { playDingDong } from "@/lib/audio";
import { trpc } from "@/utils/trpc";

import { DoorArt } from "./door/door-art";
import { HouseBell } from "./door/house-backdrop";

/**
 * "Ring a friend" — a picker on the dashboard showing each friend's own door
 * with a tappable doorbell. Clicking a doorbell rings that friend; the door
 * itself never swings here — it only opens for the person answering it.
 */
export function RingFriendPicker({
	onClose,
	open,
}: {
	onClose: () => void;
	open: boolean;
}) {
	const friends = useQuery(
		trpc.friends.list.queryOptions(undefined, { enabled: open })
	);

	const ring = useMutation(
		trpc.rings.create.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: (_result, { targetUserId }) => {
				const friend = friends.data?.accepted.find(
					(entry) => entry.friend.id === targetUserId
				);
				playDingDong();
				toast.success(
					`Doorbell rung at ${friend?.friend.name ?? "their"} place!`
				);
				onClose();
			},
		})
	);

	if (!open) {
		return null;
	}

	const accepted = friends.data?.accepted ?? [];

	return (
		<motion.div
			animate={{ opacity: 1, scale: 1, y: 0 }}
			className="mt-4"
			id="ddd-ring-picker"
			initial={{ opacity: 0, scale: 0.97, y: 16 }}
		>
			<Card className="border-primary/20">
				<CardHeader className="flex-row items-center justify-between gap-3">
					<div>
						<CardTitle className="font-display text-lg">
							Ring a friend
						</CardTitle>
						<CardDescription>
							Tap a friend's doorbell to ring their door. Their door only opens
							if they answer.
						</CardDescription>
					</div>
					<Button onClick={onClose} size="sm" variant="ghost">
						Close
					</Button>
				</CardHeader>
				<CardContent className="space-y-2">
					{accepted.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							No friends to ring yet. Add some in the Friends tab.
						</p>
					) : (
						accepted.map((friendship) => {
							const theme =
								DOOR_SKINS.find(
									(skin) => skin.id === friendship.friend.doorSkinId
								)?.theme ?? DOOR_SKINS[0].theme;
							return (
								<FriendDoorRow
									cameraDoorbell={friendship.friend.cameraDoorbell ?? false}
									disabled={ring.isPending}
									key={friendship.friendshipId}
									name={friendship.friend.name}
									onRing={() =>
										ring.mutate({ targetUserId: friendship.friend.id })
									}
									points={friendship.friend.points}
									theme={theme}
								/>
							);
						})
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

function FriendDoorRow({
	name,
	points,
	theme,
	cameraDoorbell,
	disabled,
	onRing,
}: {
	name: string;
	points: number;
	theme: DoorSkinTheme;
	cameraDoorbell: boolean;
	disabled: boolean;
	onRing: () => void;
}) {
	return (
		<div
			className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-2"
			id="ddd-ring-friend"
		>
			<MiniFriendDoor
				cameraDoorbell={cameraDoorbell}
				disabled={disabled}
				label={name}
				onRing={onRing}
				theme={theme}
			/>
			<div className="min-w-0 flex-1">
				<p className="truncate font-semibold text-sm">{name}</p>
				<p className="text-muted-foreground text-xs">
					{points.toLocaleString()} pts
				</p>
				<Button
					className="mt-2 h-8 rounded-full px-4 text-xs"
					disabled={disabled}
					onClick={onRing}
					size="sm"
				>
					Ring the bell
				</Button>
			</div>
		</div>
	);
}

/** A friend's door on its wall, with a tappable doorbell. Never swings open. */
function MiniFriendDoor({
	theme,
	cameraDoorbell,
	disabled,
	label,
	onRing,
}: {
	theme: DoorSkinTheme;
	cameraDoorbell: boolean;
	disabled: boolean;
	label: string;
	onRing: () => void;
}) {
	return (
		<button
			aria-label={`Ring ${label}'s doorbell`}
			className="relative h-40 w-28 shrink-0 cursor-pointer overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
			disabled={disabled}
			id="ddd-ring-friend-door"
			onClick={onRing}
			style={{
				background: `linear-gradient(180deg, ${theme.wall.from}, ${theme.wall.to})`,
			}}
			type="button"
		>
			{/* Doorway on the left — frame + the closed door + a nameplate */}
			<span className="absolute top-2 bottom-2 left-[6px] w-16">
				<span
					aria-hidden="true"
					className="absolute inset-0 rounded-sm border-4"
					style={{
						borderColor: theme.frame,
						boxShadow: `inset 0 0 0 2px ${theme.frame}`,
					}}
				/>
				<span className="absolute inset-[5px] block">
					<DoorArt className="h-full w-full" theme={theme} />
				</span>
				{/* Nameplate on the door — so you always know whose door this is */}
				<span
					aria-hidden="true"
					className="absolute inset-x-[9px] bottom-[6px] truncate rounded-sm bg-black/45 px-1 py-0.5 text-center font-bold text-[9px] text-amber-50"
				>
					{label}
				</span>
			</span>

			{/* Bell on the wall to the right of the door (not on the frame) */}
			{theme.bellStyle === "knocker" ? null : (
				<span aria-hidden="true" className="absolute top-[46%] right-1 z-20">
					<HouseBell
						cameraDoorbell={cameraDoorbell}
						interactive={false}
						theme={theme}
					/>
				</span>
			)}

			{/* Tap hint */}
			<span
				aria-hidden="true"
				className="absolute right-1 bottom-1 rounded-full bg-black/35 px-1.5 py-0.5 font-semibold text-[8px] text-white/90"
			>
				Tap to ring
			</span>
		</button>
	);
}
