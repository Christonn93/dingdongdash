import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

const POLL_MS = 3000;

export function ActiveRings() {
	const [now, setNow] = useState(Date.now());

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
			onSuccess: (result) => {
				toast.success(
					result.outcome === "caught"
						? "You caught them! +10 points"
						: "Too late — the ringer ditched you. −10 points"
				);
				active.refetch();
			},
		})
	);

	const handleAnswer = useCallback(
		(ringId: string) => {
			answer.mutate({ ringId });
		},
		[answer]
	);

	const rings = active.data?.rings ?? [];

	if (rings.length === 0) {
		return null;
	}

	return (
		<div className="space-y-3">
			{rings.map((incoming) => {
				const remainingMs = new Date(incoming.expiresAt).getTime() - now;
				const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
				return (
					<Card className="border-primary/40 bg-primary/10" key={incoming.id}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
								{incoming.ringer.name} is at your door
							</CardTitle>
							<CardDescription>
								Answer within {secondsLeft}s or they ditch you.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								disabled={answer.isPending || secondsLeft === 0}
								// biome-ignore lint/performance/noJsxPropsBind: per-ring answer action
								onClick={() => handleAnswer(incoming.id)}
							>
								{secondsLeft === 0
									? "Too late"
									: `Open the door (${secondsLeft}s)`}
							</Button>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
