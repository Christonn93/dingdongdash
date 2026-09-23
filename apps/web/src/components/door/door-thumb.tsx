import type { DoorSkinTheme } from "@dingdongdash/api/lib/door-catalog";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { playRingSound } from "@/lib/audio";
import { spring } from "@/lib/motion";

import { DoorArt } from "./door-art";
import { HouseBell } from "./house-backdrop";

/**
 * A small tappable house preview for the shop — a door on its wall with a lit
 * window and the bell on the wall, so it matches the real layout. Tapping it
 * rings the door (sound + a little wiggle) to audition each design.
 */
export function DoorThumb({
	theme,
	cameraDoorbell,
	label,
	onRing,
	skinId,
}: {
	theme: DoorSkinTheme;
	cameraDoorbell: boolean;
	label: string;
	onRing?: () => void;
	skinId?: string;
}) {
	const reduceMotion = useReducedMotion();
	const [pings, setPings] = useState(0);
	const rootId = skinId ? `ddd-thumb-${skinId}` : "ddd-thumb";

	const ring = () => {
		setPings((count) => count + 1);
		playRingSound(theme.bellStyle);
		onRing?.();
	};

	return (
		<button
			aria-label={label}
			className="relative block h-48 w-full cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60"
			id={rootId}
			onClick={ring}
			style={{
				background: `linear-gradient(180deg, ${theme.wall.from}, ${theme.wall.to})`,
			}}
			type="button"
		>
			{/* Lit window on the right wall */}
			<span
				aria-hidden="true"
				className="absolute top-5 right-3 h-24 w-14"
				id={`${rootId}-window`}
			>
				<span
					className="absolute inset-0 rounded-t-2xl rounded-b-sm border-[3px]"
					style={{
						background: "linear-gradient(180deg,#ffe8c0,#ffc98a 60%,#e0a86b)",
						borderColor: theme.frame,
					}}
				/>
				<span className="absolute inset-x-0 top-0 flex h-full flex-col justify-center px-0.5">
					<span className="border-t-2" style={{ borderColor: theme.frame }} />
					<span
						className="mt-2 border-t-2"
						style={{ borderColor: theme.frame }}
					/>
				</span>
				<span
					className="absolute inset-y-0 left-1/2 border-l-2"
					style={{ borderColor: theme.frame }}
				/>
			</span>

			{/* Doorway — frame + door */}
			<span
				className="absolute top-6 right-4 bottom-6 left-3 w-20"
				id={`${rootId}-doorway`}
			>
				<span
					aria-hidden="true"
					className="absolute inset-0 rounded-sm border-4"
					style={{
						borderColor: theme.frame,
						boxShadow: `inset 0 0 0 2px ${theme.frame}`,
					}}
				/>
				<motion.span
					animate={
						pings > 0 && !reduceMotion
							? { rotateY: [-4, 4, 0], scale: [1, 0.97, 1] }
							: undefined
					}
					className="absolute inset-[5px] block"
					key={pings}
					style={{ transformOrigin: "left center", transformPerspective: 600 }}
					transition={{ ...spring, duration: 0.4 }}
				>
					<DoorArt
						className="h-full w-full"
						id={`${rootId}-door-art`}
						theme={theme}
					/>
				</motion.span>
			</span>

			{/* Wall-mounted bell for non-knocker doors */}
			{theme.bellStyle === "knocker" ? null : (
				<span
					aria-hidden="true"
					className="absolute top-[62%] right-2 z-20"
					id={`${rootId}-bell`}
				>
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
				className="absolute right-2 bottom-2 rounded-full bg-black/35 px-2 py-0.5 font-semibold text-[9px] text-white/90"
			>
				Tap to hear
			</span>
		</button>
	);
}
