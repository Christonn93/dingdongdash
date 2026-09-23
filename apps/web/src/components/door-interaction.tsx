import type { DoorSkinTheme } from "@dingdongdash/api/lib/door-catalog";
import { AppAvatar } from "@dingdongdash/ui/avatars/app-avatar";
import { Button } from "@dingdongdash/ui/components/button";
import { motion, useReducedMotion } from "motion/react";

import { doorSpring } from "@/lib/motion";

import { CaughtCelebration } from "./caught-celebration";
import { DoorArt } from "./door/door-art";
import {
	DOOR_SCENE_BOX,
	DOORWAY_POSITION,
	HouseBackdrop,
} from "./door/house-backdrop";

export type DoorVisualState =
	| "idle"
	| "incoming"
	| "opening"
	| "answered"
	| "expired";

export interface DoorInteractionProps {
	cameraDoorbell?: boolean;
	disabled?: boolean;
	durationMs?: number;
	isAnswering?: boolean;
	onAnswer?: () => void | Promise<void>;
	secondsRemaining?: number;
	spyCamera?: boolean;
	state: DoorVisualState;
	theme: DoorSkinTheme;
	visitorAvatarId?: string | null;
	visitorName?: string | null;
}

const DEFAULT_DURATION_MS = 30_000;

/**
 * The incoming-ring front-door moment, dressed in the owner's chosen door skin.
 * The door is fully closed until the recipient answers; the bell (or knocker)
 * and countdown support rather than compete with the door. Pure presentation —
 * all domain logic lives in the caller.
 */
export function DoorInteraction({
	cameraDoorbell = false,
	disabled,
	durationMs = DEFAULT_DURATION_MS,
	isAnswering,
	onAnswer,
	secondsRemaining = 0,
	spyCamera = false,
	state,
	theme,
	visitorAvatarId,
	visitorName,
}: DoorInteractionProps) {
	const reduceMotion = useReducedMotion();
	const open = state === "opening" || state === "answered";
	const canAnswer = state === "incoming" && !isAnswering && !disabled;
	const urgent = state === "incoming" && secondsRemaining <= 10_000;
	const lost = state === "expired";
	const seconds = Math.max(0, Math.ceil(secondsRemaining / 1000));
	const who = visitorName ?? "Someone";

	const handleAnswer = () => {
		if (!canAnswer) {
			return;
		}
		onAnswer?.();
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
				className="absolute top-[5%] right-[10%] h-9 w-9 rounded-full bg-amber-50 opacity-80 shadow-[0_0_28px_10px_rgba(255,236,179,0.35)]"
			/>

			{/* Visitor identity + countdown */}
			<div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-4 sm:px-6">
				<div className="flex min-w-0 items-center gap-2.5">
					{cameraDoorbell && visitorName ? (
						<AppAvatar
							avatarId={visitorAvatarId}
							name={visitorName}
							size="sm"
						/>
					) : (
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-amber-200/30 bg-[#2c2136]">
							<span className="text-sm">?</span>
						</span>
					)}
					<div className="min-w-0">
						<p className="truncate font-bold font-display text-amber-50 text-sm drop-shadow">
							{who} is at your door
						</p>
						<p className="truncate text-[11px] text-amber-100/75">
							{statusLine(lost, state, seconds, cameraDoorbell, visitorName)}
						</p>
					</div>
				</div>
				{state === "incoming" || state === "opening" ? (
					<CountdownBadge
						durationMs={durationMs}
						progress={secondsRemaining}
						seconds={seconds}
						urgent={urgent}
					/>
				) : null}
			</div>

			{/* The door */}
			<div className="relative z-10 flex justify-center px-4 pt-6 pb-5">
				<DoorScene
					cameraDoorbell={cameraDoorbell}
					canAnswer={canAnswer}
					lost={lost}
					onAnswer={handleAnswer}
					open={open}
					reduceMotion={reduceMotion}
					spyCamera={spyCamera}
					theme={theme}
					urgent={urgent}
					visitorName={visitorName}
				/>
			</div>

			{/* Answer action */}
			<div className="relative z-10 flex flex-col items-center gap-2 px-6 pb-6">
				<Button
					className="min-h-11 w-full max-w-xs rounded-full"
					disabled={!canAnswer}
					onClick={handleAnswer}
					size="lg"
				>
					{isAnswering ? "Opening…" : "Answer the door"}
				</Button>
				{state === "expired" ? (
					<p className="text-center text-amber-100/80 text-xs">
						This ring has expired — head to the dashboard to ring someone back.
					</p>
				) : null}
			</div>

			{state === "answered" ? (
				<CaughtCelebration name={visitorName ?? ""} />
			) : null}
		</div>
	);
}

function statusLine(
	lost: boolean,
	state: DoorVisualState,
	seconds: number,
	cameraDoorbell: boolean,
	visitorName?: string | null
): string {
	if (state === "answered") {
		return "You answered the door — you're connected!";
	}
	if (lost) {
		return "You missed this ring";
	}
	if (state === "opening") {
		return "Swinging the door open…";
	}
	if (!(cameraDoorbell || visitorName)) {
		return `A mystery ringer. Answer in ${seconds}s or they ditch you.`;
	}
	return `Answer in ${seconds}s or they ditch you`;
}

function CountdownBadge({
	durationMs,
	progress,
	seconds,
	urgent,
}: {
	durationMs: number;
	progress: number;
	seconds: number;
	urgent: boolean;
}) {
	const clamped = Math.max(0, Math.min(1, progress / durationMs));
	const radius = 20;
	const circumference = 2 * Math.PI * radius;
	return (
		<div className="relative flex shrink-0 items-center justify-center">
			<svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
				<title>Seconds left</title>
				<circle
					cx="24"
					cy="24"
					fill="rgba(0,0,0,0.35)"
					r={radius}
					stroke="rgba(255,255,255,0.18)"
					strokeWidth="5"
				/>
				<circle
					cx="24"
					cy="24"
					fill="none"
					r={radius}
					stroke={urgent ? "#f87171" : "#ffd166"}
					strokeDasharray={circumference}
					strokeDashoffset={circumference * (1 - clamped)}
					strokeLinecap="round"
					strokeWidth="5"
				/>
			</svg>
			<span
				className={`absolute inset-0 flex items-center justify-center font-display font-extrabold text-sm ${
					urgent ? "text-red-300" : "text-amber-100"
				}`}
			>
				{seconds}
			</span>
		</div>
	);
}
function DoorScene({
	cameraDoorbell,
	canAnswer,
	lost,
	onAnswer,
	open,
	reduceMotion,
	spyCamera,
	theme,
	urgent,
	visitorName,
}: {
	cameraDoorbell: boolean;
	canAnswer: boolean;
	lost: boolean;
	onAnswer: () => void;
	open: boolean;
	reduceMotion: boolean | null;
	spyCamera: boolean;
	theme: DoorSkinTheme;
	urgent: boolean;
	visitorName?: string | null;
}) {
	return (
		<div className={DOOR_SCENE_BOX}>
			<HouseBackdrop
				cameraDoorbell={cameraDoorbell}
				id="ddd-house"
				interactive={canAnswer}
				onRing={onAnswer}
				spyCamera={spyCamera}
				theme={theme}
			/>

			{/* Doorway — frame, interior glow and the swinging door */}
			<div className={DOORWAY_POSITION}>
				{/* Door frame */}
				<div
					aria-hidden="true"
					className="absolute inset-0 rounded-md border-8"
					id="ddd-frame"
					style={{
						borderColor: theme.frame,
						boxShadow: `inset 0 0 0 2px ${theme.frame}`,
					}}
				/>

				{/* Interior glow — hidden until the door opens */}
				<motion.div
					animate={{ opacity: open ? 1 : 0 }}
					aria-hidden="true"
					className="absolute inset-[8px] rounded-sm"
					id="ddd-interior-glow"
					style={{
						background:
							"linear-gradient(180deg, #ffe8c0 0%, #ffc98a 55%, #e0a86b 100%)",
						boxShadow: "inset 0 0 24px rgba(255,180,90,0.7)",
					}}
					transition={doorSpring}
				/>

				{/* The closed door — swings open from its hinge edge on answer */}
				<motion.button
					animate={
						reduceMotion
							? { opacity: open ? 0.3 : 1 }
							: { rotateY: open ? -68 : 0, x: open ? -5 : 0 }
					}
					aria-label={
						visitorName
							? `Answer the door for ${visitorName}`
							: "Answer the door"
					}
					className={`absolute inset-[8px] cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c2136] ${
						lost ? "cursor-default opacity-75 saturate-50" : ""
					} ${urgent && !open && !reduceMotion ? "ddd-urgency" : ""}`}
					disabled={!canAnswer}
					id="ddd-door"
					onClick={onAnswer}
					style={{
						boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
						transformOrigin: "left center",
						transformPerspective: 800,
					}}
					transition={doorSpring}
					type="button"
				>
					<DoorArt className="h-full w-full" id="ddd-door-art" theme={theme} />
				</motion.button>
			</div>
		</div>
	);
}
