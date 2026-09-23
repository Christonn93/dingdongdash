import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { playSparkle } from "@/lib/audio";
import { authClient } from "@/lib/auth-client";
import { celebrate, celebrateFromSides } from "@/lib/confetti";
import { spring } from "@/lib/motion";
import { trpc } from "@/utils/trpc";

import { BellBandit } from "./caught-celebration";

const POLL_MS = 4000;

function formatDelta(delta: number): string {
	return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

/**
 * Watches rings the current user *sent* and, when one resolves, shows a fun
 * animated toast — the "you got caught" (loss) or "you caught them" (win)
 * moment. The point amount is read from the ledger via `getHistory.delta`, so
 * it always matches what the server actually granted.
 */
export function RingResultToast() {
	const { data: session } = authClient.useSession();
	const meId = session?.user?.id;
	const seen = useRef<Set<string>>(new Set());
	const initialized = useRef(false);

	const history = useQuery(
		trpc.rings.getHistory.queryOptions(
			{ cursor: undefined, limit: 3 },
			{ enabled: Boolean(meId), refetchInterval: POLL_MS }
		)
	);

	useEffect(() => {
		if (!meId || history.data === undefined) {
			return;
		}
		const entries = history.data.entries ?? [];
		// Seed only once the first real payload has arrived — otherwise a ring
		// that resolved in a previous session gets treated as brand new and a
		// phantom toast fires on every page load.
		// biome-ignore lint/suspicious/noUnnecessaryConditions: ref is mutated in the effect below
		if (!initialized.current) {
			initialized.current = true;
			for (const entry of entries) {
				if (entry.status !== "pending") {
					seen.current.add(entry.id);
				}
			}
			return;
		}
		const latestSent = entries.find((entry) => entry.ringerId === meId);
		if (
			!latestSent ||
			latestSent.status === "pending" ||
			seen.current.has(latestSent.id)
		) {
			return;
		}
		seen.current.add(latestSent.id);
		if (latestSent.status === "caught") {
			toast.custom(
				(id) => (
					<CaughtToast
						delta={latestSent.delta}
						onClose={() => toast.dismiss(id)}
					/>
				),
				{ duration: 5000 }
			);
		} else {
			toast.custom(
				(id) => (
					<CaughtThemToast
						delta={latestSent.delta}
						onClose={() => toast.dismiss(id)}
					/>
				),
				{ duration: 5000 }
			);
		}
	}, [history.data, meId]);

	return null;
}

function CaughtToast({
	delta,
	onClose,
}: {
	delta: number;
	onClose: () => void;
}) {
	const reduceMotion = useReducedMotion();
	return (
		<ResultToastCard onClose={onClose} reduceMotion={reduceMotion}>
			<div className="flex items-center gap-3">
				<motion.div
					animate={reduceMotion ? { rotate: 0 } : { rotate: [-4, 4, -4] }}
					transition={{
						duration: 0.7,
						ease: "easeInOut",
						repeat: Number.POSITIVE_INFINITY,
					}}
				>
					<BellBandit />
				</motion.div>
				<div>
					<p className="font-display font-extrabold text-base">
						You got caught!
					</p>
					<p className="text-muted-foreground text-sm">
						They opened the door in time. {formatDelta(delta)} points.
					</p>
				</div>
			</div>
		</ResultToastCard>
	);
}

/** The ringer's win: the target never opened the door. Big, cheerful, loud. */
function CaughtThemToast({
	delta,
	onClose,
}: {
	delta: number;
	onClose: () => void;
}) {
	const reduceMotion = useReducedMotion();

	useEffect(() => {
		celebrate({ originY: 0.45, particleCount: 160 });
		celebrateFromSides();
		playSparkle();
	}, []);

	return (
		<ResultToastCard onClose={onClose} reduceMotion={reduceMotion}>
			<div className="flex items-center gap-3">
				<motion.div
					animate={reduceMotion ? { rotate: 0 } : { rotate: [-6, 6, -6, 0] }}
					transition={{
						duration: 0.8,
						ease: "easeInOut",
						repeat: Number.POSITIVE_INFINITY,
					}}
				>
					<DoorbellChamp />
				</motion.div>
				<div>
					<p className="font-display font-extrabold text-base text-primary">
						You caught them!
					</p>
					<p className="text-muted-foreground text-sm">
						They never made it to the door. {formatDelta(delta)} points.
					</p>
				</div>
			</div>
		</ResultToastCard>
	);
}

/** A triumphant doorbell with a party hat and confetti. */
export function DoorbellChamp() {
	return (
		<svg
			aria-hidden="true"
			className="h-20 w-16 drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]"
			viewBox="0 0 64 80"
		>
			<title>Caught them</title>
			<circle cx="10" cy="16" fill="#ffd166" r="2" />
			<circle cx="54" cy="12" fill="#43c18a" r="2.2" />
			<circle cx="12" cy="34" fill="#7c6cff" r="1.6" />
			<circle cx="52" cy="32" fill="#f0563d" r="1.6" />
			<path d="M32 2l5 11h-10z" fill="#7c6cff" />
			<circle cx="32" cy="2" fill="#ffd166" r="2" />
			<path
				d="M32 6c9 0 16 7.5 16 16.8V34a4 4 0 0 0 4 4h-2a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4h-2a4 4 0 0 0 4-4V22.8C12 13.5 23 6 32 6z"
				fill="#f0563d"
			/>
			<ellipse cx="24" cy="15" fill="#f4785f" opacity="0.7" rx="9" ry="7" />
			<circle cx="26" cy="27" fill="#2c2136" r="2.4" />
			<circle cx="38" cy="27" fill="#2c2136" r="2.4" />
			<path
				d="M26 34q6 5 12 0"
				fill="none"
				stroke="#2c2136"
				strokeLinecap="round"
				strokeWidth="2.4"
			/>
			<rect fill="#991b1b" height="6" rx="2" width="26" x="19" y="58" />
			<rect fill="#7f1d1d" height="9" rx="2.5" width="6" x="21" y="62" />
			<rect fill="#7f1d1d" height="9" rx="2.5" width="6" x="37" y="62" />
		</svg>
	);
}

function ResultToastCard({
	children,
	onClose,
	reduceMotion,
}: {
	children: React.ReactNode;
	onClose: () => void;
	reduceMotion: boolean | null;
}) {
	return (
		<motion.button
			animate={{ opacity: 1, scale: 1, y: 0 }}
			className="pointer-events-auto flex w-[min(92vw,24rem)] cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-xl"
			initial={
				reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 12 }
			}
			onClick={onClose}
			transition={spring}
			type="button"
		>
			{children}
		</motion.button>
	);
}
