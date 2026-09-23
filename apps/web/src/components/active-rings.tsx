import { DOOR_SKINS } from "@dingdongdash/api/lib/door-catalog";
import { Button } from "@dingdongdash/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	playDingDong,
	playMiss,
	playSoundById,
	playSparkle,
} from "@/lib/audio";
import { celebrate, celebrateFromSides } from "@/lib/confetti";
import { spring } from "@/lib/motion";
import { trpc } from "@/utils/trpc";

import { DoorInteraction, type DoorVisualState } from "./door-interaction";
import { RingFriendPicker } from "./ring-friend-picker";
import { DoorbellChamp } from "./ring-result-toast";

const POLL_MS = 3000;

type AnswerOutcome = "caught" | "ditched";

function formatDelta(delta: number): string {
	return `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
}

export function ActiveRings() {
	const [now, setNow] = useState(Date.now());
	const [opening, setOpening] = useState<Set<string>>(() => new Set());
	const [outcomes, setOutcomes] = useState<Map<string, AnswerOutcome>>(
		() => new Map()
	);
	const seenIncoming = useRef<Set<string>>(new Set());
	const seeded = useRef(false);

	const me = useQuery(trpc.users.me.queryOptions());
	const skin =
		DOOR_SKINS.find((item) => item.id === me.data?.user.doorSkinId) ??
		DOOR_SKINS[0];

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 500);
		return () => clearInterval(timer);
	}, []);

	const active = useQuery(
		trpc.rings.getActive.queryOptions(undefined, {
			refetchInterval: POLL_MS,
		})
	);

	// Alert when a NEW ring arrives while the dashboard is open: ding-dong,
	// an animated toast, a browser notification (if permission is granted) and
	// a brief title flash. Rings already on screen at mount are not re-announced.
	useEffect(() => {
		const incoming = active.data?.rings ?? [];
		// biome-ignore lint/suspicious/noUnnecessaryConditions: ref is mutated in the effect below
		if (!seeded.current) {
			seeded.current = true;
			for (const ringItem of incoming) {
				seenIncoming.current.add(ringItem.id);
			}
			return;
		}
		for (const ringItem of incoming) {
			if (seenIncoming.current.has(ringItem.id)) {
				continue;
			}
			seenIncoming.current.add(ringItem.id);
			announceIncomingRing(
				ringItem.ringer?.name ?? "Someone",
				me.data?.user.ringSoundId ?? "dingdong"
			);
		}
	}, [active.data, me.data]);

	const answer = useMutation(
		trpc.rings.answer.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: (result, { ringId }) => {
				const outcome = result.outcome as AnswerOutcome;
				const targetDelta = result.deltas.target;
				const incoming = active.data?.rings.find((r) => r.id === ringId);
				setOutcomes((prev) => new Map(prev).set(ringId, outcome));
				if (outcome === "caught") {
					celebrate();
					celebrateFromSides();
					playSparkle();
					toast.custom(
						(id) => (
							<YouCaughtThemToast
								delta={targetDelta}
								name={incoming?.ringer?.name ?? "They"}
								onClose={() => toast.dismiss(id)}
							/>
						),
						{ duration: 5000 }
					);
				} else {
					playMiss();
					if (targetDelta < 0) {
						toast.error(
							`Too late — the ringer ditched you. ${formatDelta(targetDelta)} points`
						);
					} else {
						toast.error("This ring already resolved.");
					}
				}
				setTimeout(() => {
					setOutcomes((prev) => {
						const next = new Map(prev);
						next.delete(ringId);
						return next;
					});
				}, 2400);
				active.refetch();
			},
		})
	);

	const handleAnswer = useCallback(
		(ringId: string) => {
			if (opening.has(ringId)) {
				return;
			}
			setOpening((prev) => new Set(prev).add(ringId));
			answer.mutate({ ringId });
		},
		[answer, opening]
	);

	const rings = active.data?.rings ?? [];

	if (rings.length === 0) {
		return <IdleDoor />;
	}

	return (
		<div className="space-y-4">
			{rings.map((incoming, index) => {
				const remainingMs = new Date(incoming.expiresAt).getTime() - now;
				const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
				const isOpening = opening.has(incoming.id);
				const outcome = outcomes.get(incoming.id) ?? null;
				const state = doorVisualState({ isOpening, outcome, secondsLeft });
				return (
					<motion.div
						animate={{ opacity: 1, scale: 1, y: 0 }}
						initial={{ opacity: 0, scale: 0.97, y: 24 }}
						key={incoming.id}
						transition={{ ...spring, delay: index * 0.08 }}
					>
						<DoorInteraction
							cameraDoorbell={me.data?.user.cameraDoorbell ?? false}
							disabled={state === "expired"}
							durationMs={incoming.durationMs}
							isAnswering={isOpening}
							onAnswer={() => handleAnswer(incoming.id)}
							secondsRemaining={remainingMs}
							spyCamera={me.data?.user.spyCamera ?? false}
							state={state}
							theme={skin.theme}
							visitorAvatarId={incoming.ringer?.avatarId}
							visitorName={incoming.ringer?.name}
						/>
					</motion.div>
				);
			})}
		</div>
	);
}

/** Maps live ring state to the presentation state the door understands. */
function doorVisualState({
	isOpening,
	outcome,
	secondsLeft,
}: {
	isOpening: boolean;
	outcome: AnswerOutcome | null;
	secondsLeft: number;
}): DoorVisualState {
	if (isOpening) {
		return "opening";
	}
	if (outcome === "caught") {
		return "answered";
	}
	if (outcome === "ditched" || secondsLeft <= 0) {
		return "expired";
	}
	return "incoming";
}

let titleFlashTimer: number | undefined;

function announceIncomingRing(name: string, soundId = "dingdong"): void {
	playSoundById(soundId);
	toast.custom(
		(id) => <IncomingRingToast name={name} onClose={() => toast.dismiss(id)} />,
		{ duration: 8000 }
	);

	if ("Notification" in window && Notification.permission === "granted") {
		try {
			const notification = new Notification("The doorbell is ringing", {
				body: `${name} is at your door — answer in 30 seconds or they ditch you.`,
			});
			notification.onclick = () => {
				window.focus();
			};
		} catch {
			// Some browsers require a service worker to show notifications.
		}
	}

	window.clearTimeout(titleFlashTimer);
	const original = document.title;
	document.title = `🔔 ${name} is at your door!`;
	titleFlashTimer = window.setTimeout(() => {
		document.title = original;
	}, 6000);
}

function IncomingRingToast({
	name,
	onClose,
}: {
	name: string;
	onClose: () => void;
}) {
	const reduceMotion = useReducedMotion();
	return (
		<motion.button
			animate={{ opacity: 1, scale: 1, y: 0 }}
			className="pointer-events-auto flex w-[min(92vw,24rem)] cursor-pointer items-center gap-3 rounded-2xl border border-primary/40 bg-card p-4 text-left shadow-xl"
			initial={
				reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }
			}
			onClick={onClose}
			transition={spring}
			type="button"
		>
			<div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
				<span className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-300" />
				<span className="flex h-9 w-9 items-center justify-center rounded-full border-[#3a2a1a] border-[3px] bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_16px_rgba(255,200,120,0.8)]">
					<span className="h-3 w-3 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-inner" />
				</span>
			</div>
			<div>
				<p className="font-display font-extrabold text-base text-primary">
					Someone's at your door!
				</p>
				<p className="text-muted-foreground text-sm">
					{name} is ringing — answer in time or they ditch you.
				</p>
			</div>
		</motion.button>
	);
}

/** The catcher's win: a big animated toast with the point reward. */
function YouCaughtThemToast({
	delta,
	name,
	onClose,
}: {
	delta: number;
	name: string;
	onClose: () => void;
}) {
	const reduceMotion = useReducedMotion();

	useEffect(() => {
		celebrate({ originY: 0.45, particleCount: 160 });
		celebrateFromSides();
		playSparkle();
	}, []);

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
					{name} never saw it coming. {formatDelta(delta)} points.
				</p>
			</div>
		</motion.button>
	);
}

function IdleDoor() {
	const reduceMotion = useReducedMotion();
	const [pings, setPings] = useState(0);
	const [pickerOpen, setPickerOpen] = useState(false);

	const handlePress = () => {
		setPings((count) => count + 1);
		playDingDong();
	};

	return (
		<div className="overflow-hidden border-none">
			<div className="relative overflow-hidden rounded-2xl">
				{/* Dusk backdrop */}
				<div
					aria-hidden="true"
					className="absolute inset-0"
					style={{
						background:
							"linear-gradient(180deg, #171233 0%, #2b2350 50%, #6b4059 75%, #b9644c 100%)",
					}}
				/>
				{/* Decorative moon — never overlaps the text (content starts below it) */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-4 right-4 h-8 w-8 rounded-full bg-amber-50 opacity-80 shadow-[0_0_26px_10px_rgba(255,236,179,0.35)]"
				/>

				{/* Content */}
				<div className="relative z-10 flex flex-col items-center gap-6 px-6 pt-14 pb-10">
					<div className="w-full max-w-sm space-y-2 text-center">
						<h3 className="font-bold font-display text-amber-50 text-lg leading-snug">
							No one's at the door right now
						</h3>
						<p className="text-amber-100/80 text-sm leading-relaxed">
							Give it a tap — the bell's for practice until a friend rings you.
						</p>
					</div>

					<motion.button
						animate={pings > 0 ? { scale: [1, 0.82, 1.06, 1] } : undefined}
						aria-label="Ring the practice doorbell"
						className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-4 border-[#3a2a1a] bg-linear-to-br from-amber-200 to-amber-400 shadow-[0_4px_14px_rgba(0,0,0,0.45),0_0_22px_rgba(255,200,120,0.85)]"
						key={pings}
						onClick={handlePress}
						style={{ transformOrigin: "center" }}
						transition={spring}
						type="button"
					>
						<span className="h-6 w-6 rounded-full bg-linear-to-br from-red-500 to-red-700 shadow-inner" />
						{pings > 0 && !reduceMotion && (
							<>
								<span
									className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-200"
									key={`a-${pings}`}
								/>
								<span
									className="ddd-pulse-ring absolute inset-0 rounded-full border-2 border-amber-200"
									key={`b-${pings}`}
									style={{ animationDelay: "0.35s" }}
								/>
							</>
						)}
					</motion.button>

					<Button
						className="rounded-full px-6"
						onClick={() => setPickerOpen((value) => !value)}
						size="lg"
					>
						{pickerOpen ? "Close" : "Ring a friend"}
					</Button>
				</div>

				<RingFriendPicker
					onClose={() => setPickerOpen(false)}
					open={pickerOpen}
				/>
			</div>
		</div>
	);
}
