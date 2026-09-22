import { Button } from "@dingdongdash/ui/components/button";
import { Card } from "@dingdongdash/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { playDingDong, playMiss, playSparkle } from "@/lib/audio";
import { celebrate, celebrateFromSides } from "@/lib/confetti";
import { spring } from "@/lib/motion";
import { trpc } from "@/utils/trpc";

import { RingDoor } from "./ring-door";

const POLL_MS = 3000;

type AnswerOutcome = "caught" | "ditched";

export function ActiveRings() {
	const [now, setNow] = useState(Date.now());
	const [opening, setOpening] = useState<Set<string>>(() => new Set());
	const [outcomes, setOutcomes] = useState<Map<string, AnswerOutcome>>(
		() => new Map()
	);

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 500);
		return () => clearInterval(timer);
	}, []);

	const active = useQuery(
		trpc.rings.getActive.queryOptions(undefined, {
			refetchInterval: POLL_MS,
		})
	);

	const answer = useMutation(
		trpc.rings.answer.mutationOptions({
			onError: (error) => toast.error(error.message),
			onSuccess: (result, { ringId }) => {
				const outcome = result.outcome as AnswerOutcome;
				setOutcomes((prev) => new Map(prev).set(ringId, outcome));
				if (outcome === "caught") {
					celebrate();
					celebrateFromSides();
					playSparkle();
					toast.success("You caught them! +10 points");
				} else {
					playMiss();
					toast.error("Too late — the ringer ditched you. −10 points");
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
				const isOpening = opening.has(incoming.id);
				const outcome = outcomes.get(incoming.id) ?? null;
				return (
					<motion.div
						animate={{ opacity: 1, scale: 1, y: 0 }}
						initial={{ opacity: 0, scale: 0.97, y: 24 }}
						key={incoming.id}
						transition={{ ...spring, delay: index * 0.08 }}
					>
						<div className="overflow-hidden rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] ring-1 ring-primary/30">
							<RingDoor
								answering={isOpening}
								durationMs={incoming.durationMs}
								onAnswer={() => handleAnswer(incoming.id)}
								outcome={outcome}
								remainingMs={remainingMs}
								ringerName={incoming.ringer.name}
							/>
						</div>
					</motion.div>
				);
			})}
		</div>
	);
}

function IdleDoor() {
	const reduceMotion = useReducedMotion();
	const [pings, setPings] = useState(0);

	const handlePress = () => {
		setPings((count) => count + 1);
		playDingDong();
	};

	return (
		<Card className="overflow-hidden border-none">
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
						className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-[#3a2a1a] border-[4px] bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_4px_14px_rgba(0,0,0,0.45),0_0_22px_rgba(255,200,120,0.85)]"
						key={pings}
						onClick={handlePress}
						style={{ transformOrigin: "center" }}
						transition={spring}
						type="button"
					>
						<span className="h-6 w-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-inner" />
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

					<Link to="/friends">
						<Button className="rounded-full px-6" size="lg">
							Ring a friend
						</Button>
					</Link>
				</div>
			</div>
		</Card>
	);
}
