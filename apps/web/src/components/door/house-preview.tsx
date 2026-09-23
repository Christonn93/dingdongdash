import type { DoorSkinTheme } from "@dingdongdash/api/lib/door-catalog";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { playRingSound } from "@/lib/audio";
import { doorSpring } from "@/lib/motion";

import { DoorArt } from "./door-art";
import {
	DOOR_SCENE_BOX,
	DOORWAY_POSITION,
	HouseBackdrop,
} from "./house-backdrop";

/**
 * A self-contained animated house preview — used on the /house page. Shows the
 * chosen door on its wall; tapping the bell or door rings it (sound + swing).
 */
export function HousePreview({
	cameraDoorbell,
	label,
	spyCamera,
	theme,
}: {
	cameraDoorbell: boolean;
	label?: string;
	spyCamera: boolean;
	theme: DoorSkinTheme;
}) {
	const reduceMotion = useReducedMotion();
	const [open, setOpen] = useState(false);

	const ring = () => {
		playRingSound(theme.bellStyle);
		setOpen(true);
		window.setTimeout(() => setOpen(false), 2600);
	};

	return (
		<div className="relative overflow-hidden rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] ring-1 ring-primary/20">
			{/* Dusk backdrop */}
			<div
				aria-hidden="true"
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(180deg, #171233 0%, #2b2350 45%, #6b4059 72%, #b9644c 100%)",
				}}
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-[6%] right-[10%] h-10 w-10 rounded-full bg-amber-50 opacity-80 shadow-[0_0_30px_10px_rgba(255,236,179,0.35)]"
			/>

			<div className="relative z-10 flex justify-center px-4 py-10 sm:py-12">
				<div className={DOOR_SCENE_BOX}>
					<HouseBackdrop
						cameraDoorbell={cameraDoorbell}
						id="ddd-preview-house"
						interactive
						label={label}
						onRing={ring}
						spyCamera={spyCamera}
						theme={theme}
					/>

					{/* Doorway — frame, glow and the swinging door */}
					<div className={DOORWAY_POSITION}>
						<div
							aria-hidden="true"
							className="absolute inset-0 rounded-md border-8"
							id="ddd-frame"
							style={{
								borderColor: theme.frame,
								boxShadow: `inset 0 0 0 2px ${theme.frame}`,
							}}
						/>

						{/* Interior glow — shows as the door swings */}
						<motion.div
							animate={{ opacity: open ? 1 : 0 }}
							aria-hidden="true"
							className="absolute inset-[8px] rounded-sm"
							id="ddd-interior-glow"
							style={{
								background:
									"linear-gradient(180deg, #ffe8c0 0%, #ffc98a 55%, #e0a86b 100%)",
								boxShadow: "inset 0 0 26px rgba(255,180,90,0.7)",
							}}
							transition={doorSpring}
						/>

						<motion.button
							animate={
								reduceMotion
									? { opacity: open ? 0.35 : 1 }
									: { rotateY: open ? -74 : 0, x: open ? -6 : 0 }
							}
							aria-label="Ring your doorbell"
							className="absolute inset-[8px] cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c2136]"
							id="ddd-door"
							onClick={ring}
							style={{
								boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
								transformOrigin: "left center",
								transformPerspective: 900,
							}}
							transition={doorSpring}
							type="button"
						>
							<DoorArt
								className="h-full w-full"
								id="ddd-door-art"
								theme={theme}
							/>
						</motion.button>
					</div>
				</div>
			</div>

			{/* Hint */}
			<p className="relative z-10 pb-5 text-center text-amber-100/70 text-xs">
				Tap the bell (or the door) to hear how it sounds
			</p>
		</div>
	);
}
