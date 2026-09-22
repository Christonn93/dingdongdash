import { AppAvatar } from "@dingdongdash/ui/avatars/app-avatar";
import { Button } from "@dingdongdash/ui/components/button";
import type { AvatarId } from "@dingdongdash/db/game";
import { motion, useReducedMotion } from "motion/react";

import { doorSpring } from "@/lib/motion";

import { CaughtCelebration } from "./caught-celebration";

export type DoorVisualState =
	| "idle"
	| "incoming"
	| "opening"
	| "answered"
	| "expired";

export interface DoorInteractionProps {
	disabled?: boolean;
	isAnswering?: boolean;
	onAnswer?: () => void | Promise<void>;
	secondsRemaining?: number;
	state: DoorVisualState;
	visitorAvatarId?: AvatarId | null;
	visitorName?: string;
}

/**
 * The incoming-ring front-door moment. The door is fully closed until the
 * recipient answers; the bell is mounted on the frame, and the countdown and
 * answer action support rather than compete with the door. Pure presentation —
 * all domain logic lives in the caller.
 */
export function DoorInteraction({
	disabled,
	isAnswering,
	onAnswer,
	secondsRemaining = 0,
	state,
	visitorAvatarId,
	visitorName,
}: DoorInteractionProps) {
	const reduceMotion = useReducedMotion();
	const open = state === "opening" || state === "answered";
	const canAnswer = state === "incoming" && !isAnswering && !disabled;
	const urgent = state === "incoming" && secondsRemaining <= 10;
	const lost = state === "expired";
	const seconds = Math.max(0, secondsRemaining);

	const handleAnswer = () => {
		if (!canAnswer) {
			return;
		}
		void onAnswer?.();
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
					<AppAvatar avatarId={visitorAvatarId} name={visitorName} size="sm" />
					<div className="min-w-0">
						<p className="truncate font-bold font-display text-amber-50 text-sm drop-shadow">
							{visitorName} is at your door
						</p>
						<p className="truncate text-[11px] text-amber-100/75">
							{statusLine(lost, state, seconds)}
						</p>
					</div>
				</div>
				{state === "incoming" || state === "opening" ? (
					<CountdownBadge progress={secondsRemaining} seconds={seconds} urgent={urgent} />
				) : null}
			</div>

			{/* The door */}
			<div className="relative z-10 flex justify-center px-4 pt-6 pb-5">
				<DoorScene
					canAnswer={canAnswer}
					open={open}
					onAnswer={handleAnswer}
					reduceMotion={reduceMotion}
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

			{state === "answered" ? <CaughtCelebration name={visitorName} /> : null}
		</div>
	);
}

function statusLine(
	lost: boolean,
	state: DoorVisualState,
	seconds: number
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
	return `Answer in ${seconds}s or they ditch you`;
}

function CountdownBadge({
	progress,
	seconds,
	urgent,
}: {
	progress: number;
	seconds: number;
	urgent: boolean;
}) {
	const clamped = Math.max(0, Math.min(1, progress / 30_000));
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
	canAnswer,
	onAnswer,
	open,
	reduceMotion,
	urgent,
	visitorName,
}: {
	canAnswer: boolean;
	onAnswer: () => void;
	open: boolean;
	reduceMotion: boolean | null;
	urgent: boolean;
	visitorName?: string;
}) {
	return (
		<div className="relative h-52 w-44 rounded-lg sm:h-60 sm:w-52">
			{/* Porch wall */}
			<div
				aria-hidden="true"
				className="absolute inset-0 rounded-lg"
				style={{
					background: "linear-gradient(180deg, #8a4f3f 0%, #7a4638 100%)",
					boxShadow: "0 22px 44px -14px rgba(0,0,0,0.6)",
				}}
			/>

			{/* Porch light + house number */}
			<div className="absolute top-[6px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
				<span
					aria-hidden="true"
					className="ddd-glow h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_10px_3px_rgba(255,220,150,0.9)]"
				/>
				<span
					aria-hidden="true"
					className="flex h-3.5 items-center rounded-sm bg-[#2c2136] px-1.5 font-bold text-[8px] text-amber-100 tracking-widest"
				>
					17
				</span>
			</div>

			{/* Door frame */}
			<div
				aria-hidden="true"
				className="absolute inset-[12px] rounded-md border-8 border-[#2c2136]"
			/>

			{/* Interior glow — hidden until the door opens */}
			<motion.div
				animate={{ opacity: open ? 1 : 0 }}
				aria-hidden="true"
				className="absolute inset-[20px] rounded-sm"
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
				className={`absolute inset-y-[20px] left-[20px] z-10 w-[calc(100%-40px)] cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c2136] ${
					canAnswer ? "" : "cursor-default"
				} ${open ? "" : ""} ${
					!canAnswer ? "opacity-75 saturate-50" : ""
				} ${urgent && !open && !reduceMotion ? "ddd-urgency" : ""}`}
				disabled={!canAnswer}
				onClick={onAnswer}
				style={{
					background: "linear-gradient(180deg, #8a5a34 0%, #6f4626 100%)",
					boxShadow:
						"inset -7px 0 12px rgba(0,0,0,0.35), inset 3px 0 6px rgba(255,220,170,0.18), 0 6px 14px rgba(0,0,0,0.35)",
					transformOrigin: "left center",
					transformPerspective: 800,
				}}
				transition={doorSpring}
				type="button"
			>
				{/* Vertical planks */}
				<span
					aria-hidden="true"
					className="absolute inset-x-1 top-1.5 bottom-1.5 rounded-sm opacity-30"
					style={{
						background:
							"repeating-linear-gradient(90deg, transparent 0px, transparent 16px, #4c3118 16px, #4c3118 18px)",
					}}
				/>
				{/* Top panel */}
				<span
					aria-hidden="true"
					className="absolute top-2.5 right-1.5 left-1.5 h-8 rounded-sm border-[3px] border-[#5b3c22]"
				/>
				{/* Bottom panel */}
				<span
					aria-hidden="true"
					className="absolute right-1.5 bottom-2.5 left-1.5 h-9 rounded-sm border-[3px] border-[#5b3c22]"
				/>
				{/* Door knob near the opening edge */}
				<span
					aria-hidden="true"
					className="absolute top-1/2 right-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
				/>
			</motion.button>

			{/* Doorbell mounted on the frame, near the handle side */}
			<button
				aria-label={canAnswer ? "Answer the doorbell" : "Doorbell"}
				className={`absolute top-[52px] -right-1.5 z-20 cursor-pointer rounded-full ${
					canAnswer ? "" : "cursor-default"
				}`}
				disabled={!canAnswer}
				onClick={onAnswer}
				type="button"
			>
				<span className="relative flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#2c2136] bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_2px_5px_rgba(0,0,0,0.4),0_0_12px_rgba(255,200,120,0.8)]">
					<span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-red-500 to-red-700" />
				</span>
				{canAnswer && !reduceMotion ? (
					<span
						aria-hidden="true"
						className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-200"
					/>
				) : null}
			</button>
		</div>
	);
}