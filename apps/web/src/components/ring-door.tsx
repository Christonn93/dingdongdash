import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { doorSpring } from "@/lib/motion";

interface RingDoorProps {
	answering: boolean;
	durationMs: number;
	onAnswer: () => void;
	outcome: "caught" | "ditched" | null;
	remainingMs: number;
	ringerName: string;
}

/**
 * The incoming-ring experience: a little door that is *ringing* at you.
 * Click the door to answer before the countdown runs out.
 */
export function RingDoor({
	answering,
	durationMs,
	onAnswer,
	outcome,
	remainingMs,
	ringerName,
}: RingDoorProps) {
	const [bellPing, setBellPing] = useState(0);

	const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
	const progress = Math.max(0, Math.min(1, remainingMs / durationMs));
	const urgent = secondsLeft <= 10 && outcome === null;
	const lost = outcome === "ditched";
	const statusText = getStatusText(outcome, lost, secondsLeft);

	const handleOpen = () => {
		if (answering || outcome !== null) {
			return;
		}
		setBellPing((count) => count + 1);
		onAnswer();
	};

	return (
		<div className="relative flex h-72 flex-col items-center overflow-hidden rounded-2xl">
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
				className="absolute top-[6%] right-[12%] h-10 w-10 rounded-full bg-amber-50 opacity-90 shadow-[0_0_30px_12px_rgba(255,236,179,0.35)]"
			/>

			{/* Header row */}
			<div className="relative z-10 mt-4 flex w-full items-center justify-center gap-2 px-4">
				<span
					className={`h-2.5 w-2.5 rounded-full ${
						urgent ? "bg-red-400" : "bg-amber-300"
					}`}
					style={{ animation: "ddd-glow 0.9s ease-in-out infinite" }}
				/>
				<p className="font-bold font-display text-amber-50 text-sm drop-shadow">
					{ringerName} is at your door
				</p>
			</div>
			<p className="relative z-10 mt-0.5 font-medium text-[11px] text-amber-100/80">
				{statusText}
			</p>

			<RingScene
				answering={answering}
				lost={lost}
				onRing={handleOpen}
				outcome={outcome}
				ping={bellPing}
				progress={progress}
				ringerName={ringerName}
				secondsLeft={secondsLeft}
				urgent={urgent}
			/>
		</div>
	);
}

interface RingSceneProps {
	answering: boolean;
	lost: boolean;
	onRing: () => void;
	outcome: "caught" | "ditched" | null;
	ping: number;
	progress: number;
	ringerName: string;
	secondsLeft: number;
	urgent: boolean;
}

interface DoorAnim {
	opacity?: number;
	rotateY?: number;
	scaleX?: number;
	x?: number;
	y?: number;
}

function interiorGlow(open: boolean, reduceMotion: boolean): DoorAnim {
	const opacity = open ? 1 : 0.5;
	if (reduceMotion) {
		return { opacity };
	}
	return { opacity, scaleX: open ? 1 : 0.94 };
}

function doorSwing(open: boolean, reduceMotion: boolean): DoorAnim {
	if (reduceMotion) {
		return { opacity: open ? 0.4 : 1 };
	}
	return { rotateY: open ? -70 : 0, x: open ? -4 : 0 };
}

function RingScene({
	answering,
	lost,
	onRing,
	outcome,
	ping,
	progress,
	ringerName,
	secondsLeft,
	urgent,
}: RingSceneProps) {
	const reduceMotion = useReducedMotion();
	const radius = 30;
	const circumference = 2 * Math.PI * radius;
	const open = answering || outcome === "caught";

	return (
		<div className="relative z-10 mt-3">
			<div className="relative flex h-44 w-40 flex-col items-center rounded-t-md bg-[#8a4f3f] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)]">
				{/* Roof */}
				<div
					aria-hidden="true"
					className="absolute -top-6 left-1/2 h-7 w-44 -translate-x-1/2"
					style={{
						background: "#241d40",
						clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
					}}
				/>
				{/* Doorway */}
				<div className="absolute bottom-0 flex justify-center">
					<div className="relative h-32 w-24">
						{/* Interior */}
						<motion.div
							animate={interiorGlow(open, reduceMotion)}
							aria-hidden="true"
							className="absolute inset-0"
							style={{
								background:
									"linear-gradient(180deg, #ffe8c0 0%, #ffc98a 55%, #e0a86b 100%)",
								transformOrigin: "right center",
							}}
							transition={doorSpring}
						/>
						<div className="absolute inset-0 rounded-t-[4px] border-4 border-[#3a2a1a]" />

						{/* Door */}
						<motion.button
							animate={doorSwing(open, reduceMotion)}
							aria-label={`Open the door to answer ${ringerName}`}
							className={`absolute inset-y-0 left-0 z-10 w-[calc(100%-10px)] cursor-pointer rounded-t-[4px] outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 ${
								lost ? "opacity-70 grayscale" : ""
							} ${urgent && !answering && !reduceMotion ? "ddd-urgency" : ""}`}
							onClick={onRing}
							style={{
								background: "linear-gradient(180deg, #8a5a34 0%, #6f4626 100%)",
								boxShadow:
									"inset -6px 0 10px rgba(0,0,0,0.3), inset 2px 0 5px rgba(255,220,170,0.18)",
								transformOrigin: "left center",
								transformPerspective: 800,
							}}
							transition={doorSpring}
							type="button"
						>
							<span
								aria-hidden="true"
								className="absolute inset-x-0 top-1.5 bottom-1.5 opacity-30"
								style={{
									background:
										"repeating-linear-gradient(90deg, transparent 0px, transparent 18px, #4c3118 18px, #4c3118 20px)",
								}}
							/>
							<span
								aria-hidden="true"
								className="absolute top-5 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full border-[#4c3118] border-[3px] bg-[#ffd9a0]"
							/>
							<span
								aria-hidden="true"
								className="absolute top-1/2 right-1.5 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-amber-300"
							/>
						</motion.button>

						{/* Doorbell */}
						<RingDoorbell onRing={onRing} ping={ping} />
					</div>
				</div>
			</div>

			{/* Countdown badge */}
			<div className="absolute -right-16 -bottom-4 flex flex-col items-center">
				<div className="relative h-16 w-16">
					<svg className="h-16 w-16 -rotate-90" viewBox="0 0 80 80">
						<title>Countdown</title>
						<circle
							cx="40"
							cy="40"
							fill="none"
							r={radius}
							stroke="currentColor"
							strokeWidth="6"
						/>
						<circle
							cx="40"
							cy="40"
							fill="none"
							r={radius}
							stroke={urgent ? "#f87171" : "#ffd166"}
							strokeDasharray={circumference}
							strokeDashoffset={circumference * (1 - progress)}
							strokeLinecap="round"
							strokeWidth="6"
						/>
					</svg>
					<span
						className={`absolute inset-0 flex items-center justify-center font-display font-extrabold text-lg ${
							urgent ? "text-red-300" : "text-amber-100"
						}`}
					>
						{secondsLeft}
					</span>
				</div>
				{!lost && outcome !== "caught" && (
					<span className="mt-1 rounded-full bg-black/40 px-2 py-0.5 font-semibold text-[9px] text-amber-100 uppercase tracking-wide">
						{answering ? "Opening…" : "Tap the door"}
					</span>
				)}
			</div>
		</div>
	);
}

function RingDoorbell({ ping, onRing }: { ping: number; onRing: () => void }) {
	const reduceMotion = useReducedMotion();
	return (
		<button
			aria-label="Ring the doorbell"
			className="absolute top-8 -right-2 z-20 cursor-pointer"
			onClick={onRing}
			type="button"
		>
			<span className="relative flex h-8 w-8 items-center justify-center rounded-full border-[#3a2a1a] border-[3px] bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_2px_5px_rgba(0,0,0,0.4),0_0_12px_rgba(255,200,120,0.8)]">
				<span className="h-3 w-3 rounded-full bg-gradient-to-br from-red-500 to-red-700" />
			</span>
			{ping > 0 && !reduceMotion ? (
				<>
					<span
						className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-200"
						key={`a-${ping}`}
					/>
					<span
						className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-200"
						key={`b-${ping}`}
						style={{ animationDelay: "0.35s" }}
					/>
				</>
			) : null}
		</button>
	);
}

function getStatusText(
	outcome: "caught" | "ditched" | null,
	lost: boolean,
	secondsLeft: number
): string {
	if (outcome === "caught") {
		return "You caught them!";
	}
	if (lost) {
		return "You let the clock run out";
	}
	return `Answer in ${secondsLeft}s or they ditch you`;
}
