import type { Target } from "motion/react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { doorSpring, spring } from "@/lib/motion";

interface FrontDoorProps {
	/** Helper text shown under the doormat. */
	hint: string;
	/** Optional label shown on the door (e.g. a house number or name). */
	label?: string;
	/** Fired when the door or doorbell is interacted with. */
	onOpen: () => void;
	/** Whether the door has swung open. */
	open: boolean;
}

/**
 * The full interactive porch scene: a dusk sky, a little house, and a front
 * door that swings open on a spring when you ring the bell or tap the door.
 */
export function FrontDoor({ open, hint, label, onOpen }: FrontDoorProps) {
	const [bellPing, setBellPing] = useState(0);

	const handleRing = () => {
		setBellPing((count) => count + 1);
		onOpen();
	};

	return (
		<div className="relative flex min-h-[100svh] w-full flex-col items-center overflow-hidden">
			{/* Dusk sky */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"linear-gradient(180deg, #171233 0%, #2b2350 45%, #6b4059 72%, #b9644c 100%)",
				}}
			/>

			{/* Stars */}
			<Stars />

			{/* Moon */}
			<div
				aria-hidden="true"
				className="absolute top-[9%] right-[16%] h-16 w-16 rounded-full bg-amber-50 shadow-[0_0_60px_24px_rgba(255,236,179,0.35)] sm:h-20 sm:w-20"
			/>

			{/* Distant silhouettes */}
			<div
				aria-hidden="true"
				className="absolute inset-x-0 bottom-[16%] h-24 opacity-80"
				style={{
					background:
						"linear-gradient(180deg, transparent, rgba(23,18,51,0.9))",
				}}
			>
				<div className="absolute bottom-0 left-0 h-12 w-full">
					<div
						className="absolute -bottom-1 left-[6%] h-10 w-16 rounded-t-[100%] bg-[#221a3f]"
						style={{ transform: "rotate(6deg)" }}
					/>
					<div
						className="absolute -bottom-1 left-[18%] h-14 w-20 rounded-t-[100%] bg-[#1d1638]"
						style={{ transform: "rotate(-4deg)" }}
					/>
					<div
						className="absolute -bottom-1 left-[72%] h-12 w-18 rounded-t-[100%] bg-[#221a3f]"
						style={{ transform: "rotate(4deg)" }}
					/>
					<div
						className="absolute -bottom-1 left-[84%] h-16 w-16 rounded-t-[100%] bg-[#1d1638]"
						style={{ transform: "rotate(-6deg)" }}
					/>
				</div>
			</div>

			{/* Porch light spill */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute top-[30%] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-60"
				style={{
					background:
						"radial-gradient(circle, rgba(255,214,150,0.4) 0%, transparent 65%)",
				}}
			/>

			<Porch label={label} onRing={handleRing} open={open} ping={bellPing} />

			{/* Hint */}
			<div className="relative z-20 mt-14 flex flex-col items-center gap-2 text-center">
				<p className="max-w-xs font-medium text-amber-100/90 text-sm drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
					{hint}
				</p>
				<div aria-hidden="true" className="ddd-float text-amber-200/80">
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						viewBox="0 0 24 24"
					>
						<title>Scroll down</title>
						<path
							d="M19 14l-7 7-7-7M12 3v18"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
			</div>
		</div>
	);
}

interface PorchProps {
	label?: string;
	onRing: () => void;
	open: boolean;
	ping: number;
}

function interiorGlow(open: boolean, reduceMotion: boolean | null): Target {
	const opacity = open ? 1 : 0.55;
	if (reduceMotion) {
		return { opacity };
	}
	return { opacity, scaleX: open ? 1 : 0.94 };
}

function doorSwing(open: boolean, reduceMotion: boolean | null): Target {
	if (reduceMotion) {
		return { opacity: open ? 0.4 : 1 };
	}
	return { rotateY: open ? -74 : 0, x: open ? -6 : 0 };
}

function doormatShift(open: boolean, reduceMotion: boolean | null): Target {
	if (reduceMotion) {
		return { opacity: open ? 0.5 : 1 };
	}
	return { opacity: open ? 0.55 : 1, y: open ? 3 : 0 };
}

function Porch({ label, onRing, open, ping }: PorchProps) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="relative z-10 mt-[24vh] flex flex-col items-center">
			<div className="relative">
				{/* Roof */}
				<div
					aria-hidden="true"
					className="absolute -top-10 left-1/2 h-12 w-64 -translate-x-1/2 sm:w-72"
					style={{
						background:
							"linear-gradient(90deg, #241d40 0%, #342a55 50%, #241d40 100%)",
						clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
					}}
				/>
				{/* Facade */}
				<div
					className="relative flex h-80 w-60 flex-col items-center rounded-t-lg sm:h-[22rem] sm:w-72"
					style={{
						background: "linear-gradient(180deg, #8a4f3f 0%, #7a4638 100%)",
						boxShadow: "0 30px 60px -20px rgba(0,0,0,0.55)",
					}}
				>
					{/* Siding lines */}
					<div
						aria-hidden="true"
						className="absolute inset-x-2 top-3 bottom-3 rounded-t-md opacity-25"
						style={{
							background:
								"repeating-linear-gradient(0deg, transparent 0px, transparent 17px, #5f372c 17px, #5f372c 18px)",
						}}
					/>
					{/* Windows */}
					<div className="absolute top-7 left-5 h-10 w-12 rounded-t-md border-[#5b3527] border-[3px] bg-[#ffd9a0] opacity-90 shadow-[inset_0_0_12px_rgba(255,150,80,0.6)]" />
					<div className="absolute top-7 right-5 h-10 w-12 rounded-t-md border-[#5b3527] border-[3px] bg-[#ffd9a0] opacity-90 shadow-[inset_0_0_12px_rgba(255,150,80,0.6)]" />

					{/* Porch lamp */}
					<div className="absolute -top-1 left-1/2 -translate-x-1/2">
						<div className="h-3 w-7 rounded-t-sm bg-[#3a2a1a]" />
						<div className="ddd-glow h-4 w-4 rounded-full bg-amber-200 shadow-[0_0_16px_6px_rgba(255,220,150,0.8)]" />
					</div>

					{/* Number plate */}
					<div className="absolute top-16 left-1/2 flex h-6 -translate-x-1/2 items-center rounded-md bg-[#2c2136] px-2 font-bold text-[10px] text-amber-100 tracking-widest shadow-sm">
						{label ?? "17"}
					</div>

					{/* Doorway */}
					<div className="absolute bottom-0 flex justify-center">
						<div className="relative h-60 w-36 sm:h-64 sm:w-40">
							{/* Interior glow (visible when open) */}
							<motion.div
								animate={interiorGlow(open, reduceMotion)}
								aria-hidden="true"
								className="absolute inset-0"
								style={{
									background:
										"linear-gradient(180deg, #ffe8c0 0%, #ffc98a 55%, #e0a86b 100%)",
									boxShadow:
										"inset 0 0 40px rgba(255,180,90,0.6), 0 0 50px rgba(255,200,120,0.35)",
									transformOrigin: "right center",
								}}
								transition={doorSpring}
							/>

							{/* Door frame */}
							<div className="absolute inset-0 rounded-t-[6px] border-[#3a2a1a] border-[6px] shadow-[inset_0_0_0_2px_#5b3c22]" />

							{/* The swinging door */}
							<motion.button
								animate={doorSwing(open, reduceMotion)}
								aria-label="Open the door"
								className="absolute inset-y-0 left-0 z-10 w-[calc(100%-14px)] cursor-pointer rounded-t-[6px] outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a2a1a]"
								onClick={onRing}
								style={{
									background:
										"linear-gradient(180deg, #8a5a34 0%, #6f4626 100%)",
									boxShadow:
										"inset -8px 0 14px rgba(0,0,0,0.3), inset 3px 0 6px rgba(255,220,170,0.18)",
									transformOrigin: "left center",
									transformPerspective: 900,
								}}
								transition={doorSpring}
								type="button"
							>
								{/* Planks */}
								<span
									aria-hidden="true"
									className="absolute inset-x-0 top-2 bottom-2 opacity-30"
									style={{
										background:
											"repeating-linear-gradient(90deg, transparent 0px, transparent 26px, #4c3118 26px, #4c3118 28px)",
									}}
								/>
								{/* Round window */}
								<span
									aria-hidden="true"
									className="absolute top-8 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border-[#4c3118] border-[4px] bg-[#ffd9a0] shadow-[inset_0_0_10px_rgba(255,150,80,0.7)]"
								/>
								{/* Door knob */}
								<span
									aria-hidden="true"
									className="absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
								/>
							</motion.button>

							{/* Doorbell */}
							<Doorbell onRing={onRing} ping={ping} />
						</div>
					</div>
				</div>

				{/* Porch floor */}
				<div
					aria-hidden="true"
					className="absolute -bottom-5 left-1/2 h-10 w-72 -translate-x-1/2 rounded-[50%] bg-[#241d40] shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:w-80"
				/>

				{/* Doormat */}
				<motion.div
					animate={doormatShift(open, reduceMotion)}
					className="absolute -bottom-2 left-1/2 flex h-8 w-24 -translate-x-1/2 items-center justify-center rounded-md border border-[#3a2a1a] bg-[#7a4638] font-bold text-[9px] text-amber-100 tracking-[0.2em] shadow-md"
					transition={spring}
				>
					WELCOME
				</motion.div>
			</div>
		</div>
	);
}

const STARS = [
	{ delay: "0s", id: "s1", left: "14%", size: 2, top: "12%" },
	{ delay: "0.6s", id: "s2", left: "78%", size: 3, top: "18%" },
	{ delay: "1.2s", id: "s3", left: "8%", size: 2, top: "30%" },
	{ delay: "0.3s", id: "s4", left: "88%", size: 2, top: "26%" },
	{ delay: "0.9s", id: "s5", left: "46%", size: 2, top: "8%" },
	{ delay: "1.5s", id: "s6", left: "22%", size: 1, top: "38%" },
	{ delay: "0.2s", id: "s7", left: "70%", size: 1, top: "34%" },
] as const;

function Stars() {
	return (
		<div aria-hidden="true" className="pointer-events-none absolute inset-0">
			{STARS.map((star) => (
				<span
					className="ddd-glow absolute rounded-full bg-amber-100"
					key={star.id}
					style={{
						animationDelay: star.delay,
						height: star.size,
						left: star.left,
						opacity: 0.8,
						top: star.top,
						width: star.size,
					}}
				/>
			))}
		</div>
	);
}

function Doorbell({ ping, onRing }: { ping: number; onRing: () => void }) {
	const reduceMotion = useReducedMotion();
	return (
		<motion.button
			animate={ping > 0 ? { scale: [1, 0.82, 1.05, 1] } : undefined}
			aria-label="Ring the doorbell"
			className="absolute top-12 -right-2 z-20 cursor-pointer"
			key={ping}
			onClick={onRing}
			style={{ transformOrigin: "center" }}
			transition={spring}
			type="button"
		>
			<span className="relative flex h-9 w-9 items-center justify-center rounded-full border-[#3a2a1a] border-[3px] bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_2px_6px_rgba(0,0,0,0.4),0_0_14px_rgba(255,200,120,0.8)]">
				<span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-inner" />
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
		</motion.button>
	);
}
