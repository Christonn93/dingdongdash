import type { DoorSkinTheme } from "@dingdongdash/api/lib/door-catalog";
import { motion, useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion";

/**
 * Shared layout for the house scene, so the wall, the doorway and the bell all
 * line up across the dashboard door, the /house preview and the shop thumbs.
 * The doorway box is on the left; a lit window and the bell sit on the wall to
 * its right (the bell on the wall, not the frame).
 */
export const DOOR_SCENE_BOX = "relative h-72 w-64 rounded-lg sm:h-80 sm:w-72";
export const DOORWAY_POSITION = "absolute bottom-4 left-4 top-4 w-36 sm:w-40";
export const BELL_POSITION = "absolute right-6 top-[57%] z-20";

/**
 * The house wall a door hangs on — brick, stucco, concrete or a neon mural —
 * plus a lit window, the porch light, the number plate, the spy camera and the
 * wall-mounted bell / camera doorbell. The swinging door itself is a separate
 * layer (DoorArt) placed in the DOORWAY_POSITION box so it can keep its hinge
 * animation.
 */
export function HouseBackdrop({
	theme,
	spyCamera,
	cameraDoorbell,
	label = "17",
	interactive = false,
	onRing,
	id,
}: {
	theme: DoorSkinTheme;
	spyCamera: boolean;
	cameraDoorbell: boolean;
	label?: string;
	interactive?: boolean;
	onRing?: () => void;
	id?: string;
}) {
	return (
		<div
			className={`absolute inset-0 rounded-lg ${interactive ? "" : "pointer-events-none"}`}
			id={id}
		>
			{/* Wall per skin */}
			<div
				aria-hidden="true"
				className="absolute inset-0 rounded-lg"
				id="ddd-wall-surface"
				style={{
					background: wallBackground(theme),
					boxShadow: "0 22px 44px -14px rgba(0,0,0,0.6)",
				}}
			/>

			{/* Lit window on the right wall */}
			<WallWindow theme={theme} />

			{/* Porch light + house number, centered over the doorway */}
			<div
				aria-hidden="true"
				className="absolute top-1 flex flex-col items-center gap-1"
				id="ddd-porch-light"
				style={{ left: "5.5rem" }}
			>
				<span className="ddd-glow h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_10px_3px_rgba(255,220,150,0.9)]" />
				<span
					className="flex h-3.5 items-center rounded-sm bg-[#2c2136] px-1.5 font-bold text-[8px] text-amber-100 tracking-widest"
					id="ddd-number-plate"
				>
					{label}
				</span>
			</div>

			{/* Spy camera peeking above the door */}
			{spyCamera ? (
				<div
					aria-hidden="true"
					className="absolute top-3 right-3 z-20"
					id="ddd-spy-camera"
				>
					<SpyCamera />
				</div>
			) : null}

			{/* Wall-mounted bell / camera doorbell (knocker skins ring via the door) */}
			{theme.bellStyle === "knocker" ? null : (
				<div className={BELL_POSITION} id="ddd-bell">
					<HouseBell
						cameraDoorbell={cameraDoorbell}
						interactive={interactive}
						onRing={onRing}
						theme={theme}
					/>
				</div>
			)}
		</div>
	);
}

/** A warm, lit window with cross bars and a sill. */
function WallWindow({ theme }: { theme: DoorSkinTheme }) {
	return (
		<div
			aria-hidden="true"
			className="absolute top-8 right-6 h-28 w-20"
			id="ddd-window"
		>
			{/* Glass + frame */}
			<div
				className="absolute inset-0 rounded-t-[20px] rounded-b-sm border-4"
				style={{
					background: "linear-gradient(180deg,#ffe8c0,#ffc98a 60%,#e0a86b)",
					borderColor: theme.frame,
					boxShadow: "inset 0 0 18px rgba(255,180,90,0.7)",
				}}
			/>
			{/* Horizontal mullions */}
			<div className="absolute inset-x-0 top-0 flex h-full flex-col justify-center px-1">
				<div className="border-t-2" style={{ borderColor: theme.frame }} />
				<div className="mt-3 border-t-2" style={{ borderColor: theme.frame }} />
			</div>
			{/* Vertical mullion */}
			<div
				className="absolute inset-y-0 left-1/2 border-l-2"
				style={{ borderColor: theme.frame }}
			/>
			{/* Sill */}
			<div
				className="absolute right-0 -bottom-1.5 left-0 h-1.5 rounded-b-sm"
				style={{ background: theme.frame }}
			/>
			{/* Warm glow spill on the wall below */}
			<div className="absolute inset-x-0 -bottom-2 h-4 bg-amber-200/30 blur-sm" />
		</div>
	);
}

/** The interactive bell: brass bell, antique crank, touch pad, neon ring, or camera doorbell. */
export function HouseBell({
	theme,
	cameraDoorbell,
	interactive,
	onRing,
}: {
	theme: DoorSkinTheme;
	cameraDoorbell: boolean;
	interactive: boolean;
	onRing?: () => void;
}) {
	const reduceMotion = useReducedMotion();
	const tag = cameraDoorbell ? "camera-doorbell" : theme.bellStyle;

	const face = (
		<span
			className={`relative flex items-center justify-center ${
				cameraDoorbell || tag === "touch" ? "rounded-lg" : "rounded-full"
			}`}
			style={{
				...bellStyles(theme, tag),
				border: `3px solid ${theme.frame}`,
			}}
		>
			<BellFace tag={tag} theme={theme} />
		</span>
	);

	if (!interactive) {
		return face;
	}
	return (
		<motion.button
			animate={reduceMotion ? undefined : { scale: [1, 0.85, 1.08, 1] }}
			aria-label="Ring the doorbell"
			className="cursor-pointer"
			id="ddd-bell-button"
			onClick={onRing}
			transition={{ ...spring, duration: 0.35 }}
			type="button"
		>
			{face}
			{reduceMotion ? null : (
				<span
					aria-hidden="true"
					className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-200"
				/>
			)}
		</motion.button>
	);
}

/** The little inner icon of a bell — depends on the bell style / camera upgrade. */
function BellFace({ tag, theme }: { tag: string; theme: DoorSkinTheme }) {
	if (tag === "bell") {
		return (
			<span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-500 to-red-700" />
		);
	}
	if (tag === "crank") {
		return (
			<span aria-hidden="true" className="h-4 w-4">
				<CrankBell theme={theme} />
			</span>
		);
	}
	if (tag === "touch") {
		return (
			<span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(110,231,183,0.9)]" />
		);
	}
	if (tag === "neon") {
		return (
			<span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_10px_2px_var(--neon)]" />
		);
	}
	if (tag === "camera-doorbell") {
		return (
			<span className="flex flex-col items-center gap-0.5">
				<span className="flex h-3 w-3 items-center justify-center rounded-full bg-[#1a1a1f] shadow-inner">
					<span className="h-1.5 w-1.5 rounded-full bg-[#3b4cff] shadow-[0_0_4px_#3b4cff]" />
				</span>
				<span className="h-1 w-1 rounded-full bg-red-400" />
			</span>
		);
	}
	return null;
}

function bellStyles(theme: DoorSkinTheme, tag: string): React.CSSProperties {
	if (tag === "camera-doorbell") {
		return {
			background: "linear-gradient(180deg, #f5f5f7 0%, #d4d4d8 100%)",
			height: 34,
			width: 26,
		};
	}
	if (tag === "touch") {
		return {
			background: "linear-gradient(180deg, #e4e4e7 0%, #a1a1aa 100%)",
			height: 30,
			width: 22,
		};
	}
	if (tag === "crank") {
		return {
			background: "linear-gradient(180deg, #e9cf8f 0%, #b07a24 100%)",
			height: 30,
			width: 22,
		};
	}
	if (tag === "neon") {
		return {
			["--neon" as string]: theme.neon ?? "#ff5cf0",
			background: theme.neon ?? "#ff5cf0",
			boxShadow: `0 0 14px 3px ${theme.neon ?? "#ff5cf0"}`,
			height: 30,
			width: 30,
		};
	}
	return {
		background: "linear-gradient(180deg, #f2c14e 0%, #b07a24 100%)",
		boxShadow: "0 0 12px rgba(255,200,120,0.8)",
		height: 30,
		width: 30,
	};
}

/** A tiny antique brass crank — turn it and it clatters. */
function CrankBell({ theme }: { theme: DoorSkinTheme }) {
	return (
		<svg className="h-4 w-4" viewBox="0 0 20 20">
			<title>Antique bell</title>
			<circle cx="10" cy="10" fill={theme.hardware} r="7" />
			<circle
				cx="10"
				cy="10"
				fill="none"
				r="4.5"
				stroke="#5b3a10"
				strokeWidth="1.5"
			/>
			<rect fill="#5b3a10" height="3" rx="1" width="9" x="5.5" y="8.5" />
			<rect fill="#ffe08a" height="1.6" rx="0.8" width="6" x="7" y="9.2" />
		</svg>
	);
}

/** A little black security camera mounted above the door. */
export function SpyCamera() {
	return (
		<div
			aria-hidden="true"
			className="flex flex-col items-center"
			style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
		>
			<div className="flex h-5 w-7 items-center justify-center rounded-sm border border-[#3f3f46] bg-[#1c1c22]">
				<div className="h-2.5 w-2.5 rounded-full border border-[#52525b] bg-[#0ea5e9] shadow-[0_0_5px_#0ea5e9]" />
			</div>
			<div className="h-2 w-1 rounded-b-sm bg-[#18181b]" />
		</div>
	);
}

/** Wall texture layers for each skin. */
function wallBackground(theme: DoorSkinTheme): string {
	const { from, to } = theme.wall;
	switch (theme.bellStyle) {
		case "knocker": // cottage stucco
			return `repeating-linear-gradient(0deg, transparent 0 26px, rgba(0,0,0,0.05) 26px 27px), linear-gradient(180deg, ${from}, ${to})`;
		case "crank": // victorian brick
			return `repeating-linear-gradient(0deg, transparent 0 20px, rgba(0,0,0,0.14) 20px 22px), repeating-linear-gradient(90deg, transparent 0 46px, rgba(0,0,0,0.1) 46px 48px), linear-gradient(180deg, ${from}, ${to})`;
		case "touch": // modern concrete
			return `repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.05) 60px 62px), linear-gradient(180deg, ${from}, ${to})`;
		case "neon": // neon mural
			return `radial-gradient(circle at 78% 24%, ${theme.neon ?? "#ff5cf0"}22, transparent 46%), radial-gradient(circle at 20% 60%, #7c6cff33, transparent 40%), linear-gradient(180deg, ${from}, ${to})`;
		default: // classic warm brick
			return `repeating-linear-gradient(0deg, transparent 0 20px, rgba(0,0,0,0.13) 20px 22px), repeating-linear-gradient(90deg, transparent 0 52px, rgba(0,0,0,0.09) 52px 54px), linear-gradient(180deg, ${from}, ${to})`;
	}
}
