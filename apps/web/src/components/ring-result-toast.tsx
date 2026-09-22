import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { spring } from "@/lib/motion";
import { trpc } from "@/utils/trpc";

import { BellBandit } from "./caught-celebration";

const POLL_MS = 4000;

/**
 * Watches rings the current user *sent* and, when one resolves, shows a fun
 * animated toast — the "you got caught" (or "they ditched you") moment.
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
		const entries = history.data?.entries ?? [];
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
			toast.custom((id) => <CaughtToast onClose={() => toast.dismiss(id)} />, {
				duration: 5000,
			});
		} else {
			toast.custom((id) => <DitchedToast onClose={() => toast.dismiss(id)} />, {
				duration: 5000,
			});
		}
	}, [history.data, meId]);

	return null;
}

function CaughtToast({ onClose }: { onClose: () => void }) {
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
						They opened the door in time. −5 points.
					</p>
				</div>
			</div>
		</ResultToastCard>
	);
}

function DitchedToast({ onClose }: { onClose: () => void }) {
	const reduceMotion = useReducedMotion();
	return (
		<ResultToastCard onClose={onClose} reduceMotion={reduceMotion}>
			<motion.div
				animate={reduceMotion ? { opacity: 1 } : { y: [0, -4, 0] }}
				className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted font-black font-display text-2xl text-muted-foreground"
				transition={{
					duration: 0.9,
					ease: "easeInOut",
					repeat: Number.POSITIVE_INFINITY,
				}}
			>
				<svg
					className="h-6 w-6"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					viewBox="0 0 24 24"
				>
					<title>Ditched</title>
					<path
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</motion.div>
			<div>
				<p className="font-display font-extrabold text-base">
					They ditched you
				</p>
				<p className="text-muted-foreground text-sm">
					The timer ran out. −10 points.
				</p>
			</div>
		</ResultToastCard>
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
