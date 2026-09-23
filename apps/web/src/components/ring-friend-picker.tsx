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
import { useRef } from "react";
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
		trpc.friends.list.queryOptions(undefined, {
			enabled: open,
			refetchInterval: open ? 5000 : undefined,
		})
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
			className="relative"
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
				<CardContent>
					{accepted.length === 0 ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							No friends to ring yet. Add some in the Friends tab.
						</p>
					) : (
						<FriendCarousel
							accepted={accepted}
							disabled={ring.isPending}
							onRing={(targetUserId) => ring.mutate({ targetUserId })}
						/>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

/** A horizontal, snap-scrolling carousel of friends' doors — swipe or use the arrows. */
function FriendCarousel({
	accepted,
	disabled,
	onRing,
}: {
	accepted: Array<{
		friend: {
			cameraDoorbell?: boolean;
			doorSkinId?: string;
			id: string;
			name: string;
			points: number;
		};
		friendshipId: string;
	}>;
	disabled: boolean;
	onRing: (targetUserId: string) => void;
}) {
	const trackRef = useRef<HTMLDivElement>(null);

	const scroll = (direction: -1 | 1) => {
		trackRef.current?.scrollBy({ behavior: "smooth", left: direction * 300 });
	};

	return (
		<div className="relative">
			<div
				className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				id="ddd-ring-carousel"
				ref={trackRef}
			>
				{accepted.map((friendship) => {
					const theme =
						DOOR_SKINS.find((skin) => skin.id === friendship.friend.doorSkinId)
							?.theme ?? DOOR_SKINS[0].theme;
					return (
						<FriendCarouselCard
							cameraDoorbell={friendship.friend.cameraDoorbell ?? false}
							disabled={disabled}
							key={friendship.friendshipId}
							name={friendship.friend.name}
							onRing={() => onRing(friendship.friend.id)}
							points={friendship.friend.points}
							theme={theme}
						/>
					);
				})}
			</div>

			{accepted.length > 1 ? (
				<>
					<CarouselArrow
						direction="left"
						label="Previous friend"
						onClick={() => scroll(-1)}
					/>
					<CarouselArrow
						direction="right"
						label="Next friend"
						onClick={() => scroll(1)}
					/>
				</>
			) : null}
		</div>
	);
}

function CarouselArrow({
	direction,
	label,
	onClick,
}: {
	direction: "left" | "right";
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			aria-label={label}
			className="absolute top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-110"
			onClick={onClick}
			style={direction === "left" ? { left: -6 } : { right: -6 }}
			type="button"
		>
			<svg
				aria-hidden="true"
				className="h-4 w-4"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				viewBox="0 0 24 24"
			>
				<path
					d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</button>
	);
}

/** One friend's door in the carousel — a card you can spin through and ring. */
function FriendCarouselCard({
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
			className="w-44 shrink-0 snap-center rounded-2xl border border-border/60 bg-background/40 p-3 text-center"
			id="ddd-ring-friend"
		>
			<MiniFriendDoor
				cameraDoorbell={cameraDoorbell}
				disabled={disabled}
				label={name}
				onRing={onRing}
				theme={theme}
			/>
			<p className="mt-2 text-muted-foreground text-xs">
				{points.toLocaleString()} pts
			</p>
			<Button
				className="mt-2 h-8 w-full rounded-full px-4 text-xs"
				disabled={disabled}
				onClick={onRing}
				size="sm"
			>
				Ring the bell
			</Button>
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
			className="relative h-44 w-32 shrink-0 cursor-pointer overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
			disabled={disabled}
			id="ddd-ring-friend-door"
			onClick={onRing}
			style={{
				background: `linear-gradient(180deg, ${theme.wall.from}, ${theme.wall.to})`,
			}}
			type="button"
		>
			{/* Nameplate — centered over the outer frame, above the top rail */}
			<span
				aria-hidden="true"
				className="absolute top-1 z-20 -translate-x-1/2"
				style={{ left: "2.75rem" }}
			>
				<span className="block max-w-[5rem] truncate rounded-sm bg-black/45 px-1.5 py-0.5 text-center font-bold text-[9px] text-amber-50">
					{label}
				</span>
			</span>

			{/* Doorway: 72×128 with a 4px frame → interior is 64×120, the door's
			    own 160:300 aspect — so the slab fills the opening edge-to-edge
			    with a small, uniform clearance. No gap under the top rail. */}
			<span className="absolute top-9 bottom-3 left-2 w-[4.5rem]">
				<span
					aria-hidden="true"
					className="absolute inset-0 border-4"
					style={{
						borderColor: theme.frame,
						boxShadow: `inset 0 0 0 2px ${theme.frame}`,
					}}
				/>
				<span className="absolute inset-[4px] block">
					<DoorArt className="h-full w-full" theme={theme} />
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
