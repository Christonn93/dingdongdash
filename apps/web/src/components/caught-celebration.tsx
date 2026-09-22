import { motion, useReducedMotion } from "motion/react";

import { spring } from "@/lib/motion";

const STARBURST_CLIP =
	"polygon(50% 0%, 56% 18%, 74% 8%, 70% 26%, 90% 22%, 82% 40%, 100% 50%, 82% 60%, 90% 78%, 70% 74%, 74% 92%, 56% 82%, 50% 100%, 44% 82%, 26% 92%, 30% 74%, 10% 78%, 18% 60%, 0% 50%, 18% 40%, 10% 22%, 30% 26%, 26% 8%, 44% 18%)";

/**
 * The big, goofy celebration that plays when you catch a ringer: a comic
 * "GOTCHA!" stamp, a dizzy doorbell bandit caught red-handed, and a +10.
 */
export function CaughtCelebration({ name }: { name: string }) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
			{/* Comic starburst + GOTCHA stamp */}
			<motion.div
				animate={reduceMotion ? { opacity: 1 } : { rotate: -5, scale: 1 }}
				className="absolute top-2 left-1/2 -translate-x-1/2"
				initial={reduceMotion ? { opacity: 0 } : { rotate: 14, scale: 0 }}
				transition={{ ...spring, damping: 13, delay: 0.05, stiffness: 260 }}
			>
				<div
					aria-hidden="true"
					className="flex h-24 w-44 items-center justify-center"
					style={{ background: "#ffd166", clipPath: STARBURST_CLIP }}
				>
					<span className="-rotate-6 font-black font-display text-[#8a2f1d] text-xl uppercase italic drop-shadow-[1px_1px_0_#fff]">
						Gotcha!
					</span>
				</div>
			</motion.div>

			{/* The caught doorbell bandit */}
			<motion.div
				animate={reduceMotion ? { opacity: 1 } : { rotate: [-2, 2, -2] }}
				className="absolute bottom-8"
				initial={{ opacity: 0, y: 24 }}
				transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
			>
				<div className="relative">
					<BellBandit />
					{!reduceMotion && <DizzyStars />}
				</div>
			</motion.div>

			{/* +10 points chip */}
			<motion.div
				animate={
					reduceMotion
						? { opacity: 1 }
						: { opacity: [0, 1, 1, 0], y: [-8, -34, -58] }
				}
				className="absolute top-1/2 left-1/2"
				initial={{ opacity: 0 }}
				transition={{ delay: 0.5, duration: 1.6, ease: "easeOut" }}
			>
				<div className="flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-3 py-1 shadow-lg ring-1 ring-emerald-500/30">
					<span className="font-black font-display text-emerald-600">+10</span>
				</div>
			</motion.div>

			{/* Name callout */}
			{name ? (
				<motion.p
					animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }}
					className="absolute bottom-24 w-full text-center font-bold font-display text-amber-50 italic drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
					initial={{ opacity: 0 }}
					transition={{ delay: 0.6, duration: 1.8, ease: "easeOut" }}
				>
					{name} never saw it coming…
				</motion.p>
			) : null}
		</div>
	);
}

/** A cute doorbell with a bandit mask, dizzy X-eyes and little raised arms. */
export function BellBandit() {
	return (
		<svg
			aria-hidden="true"
			className="h-20 w-16 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]"
			viewBox="0 0 64 80"
		>
			<title>Caught doorbell</title>
			{/* Arms up */}
			<rect fill="#b91c1c" height="14" rx="3" width="5" x="6" y="38" />
			<rect fill="#b91c1c" height="14" rx="3" width="5" x="53" y="38" />
			<circle cx="8.5" cy="38" fill="#dc2626" r="3.5" />
			<circle cx="55.5" cy="38" fill="#dc2626" r="3.5" />
			{/* Body */}
			<path
				d="M32 6c9 0 16 7.5 16 16.8V34a4 4 0 0 0 4 4h-2a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4h-2a4 4 0 0 0 4-4V22.8C12 13.5 23 6 32 6z"
				fill="#dc2626"
			/>
			{/* Dome highlight */}
			<ellipse cx="24" cy="16" fill="#ef4444" opacity="0.7" rx="9" ry="7" />
			{/* Bandit mask */}
			<rect fill="#111827" height="9" rx="4.5" width="34" x="15" y="28" />
			{/* Eyes (dizzy X) */}
			<g stroke="#fff" strokeLinecap="round" strokeWidth="2.4">
				<path d="M22 31l5 5M27 31l-5 5" />
				<path d="M38 31l5 5M43 31l-5 5" />
			</g>
			{/* Mouth */}
			<path
				d="M26 42q6 5 12 0"
				fill="none"
				stroke="#111827"
				strokeLinecap="round"
				strokeWidth="2.4"
			/>
			{/* Base */}
			<rect fill="#991b1b" height="6" rx="2" width="26" x="19" y="58" />
			{/* Legs */}
			<rect fill="#7f1d1d" height="9" rx="2.5" width="6" x="21" y="62" />
			<rect fill="#7f1d1d" height="9" rx="2.5" width="6" x="37" y="62" />
		</svg>
	);
}

/** Two little stars orbiting the bandit's head. */
function DizzyStars() {
	return (
		<>
			<motion.span
				animate={{ rotate: 360 }}
				className="absolute -top-4 left-0 font-display text-amber-200 text-xl drop-shadow"
				initial={{ rotate: 0 }}
				transition={{
					duration: 0.9,
					ease: "linear",
					repeat: Number.POSITIVE_INFINITY,
				}}
			>
				✦
			</motion.span>
			<motion.span
				animate={{ rotate: -360 }}
				className="absolute -top-2 right-0 text-amber-200 text-base drop-shadow"
				initial={{ rotate: 0 }}
				transition={{
					duration: 1.1,
					ease: "linear",
					repeat: Number.POSITIVE_INFINITY,
				}}
			>
				✧
			</motion.span>
		</>
	);
}
