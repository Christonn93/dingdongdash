import { Button } from "@dingdongdash/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@dingdongdash/ui/components/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { Reveal } from "@/components/reveal";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/store")({
	component: StoreRoute,
});

function StoreRoute() {
	const catalog = useQuery(trpc.purchases.getCatalog.queryOptions());
	const inventory = useQuery(trpc.users.getInventory.queryOptions());

	const checkout = useMutation(
		trpc.purchases.createCheckout.mutationOptions({
			onSuccess: (result) => {
				window.location.assign(result.url);
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const armShield = useMutation(
		trpc.users.armTimeShield.mutationOptions({
			onSuccess: () => {
				toast.success("Time Shield armed — your next ring gets +15s");
				inventory.refetch();
			},
			onError: (error) => toast.error(error.message),
		})
	);

	const handleBuy = useCallback(
		(productId: string) => {
			checkout.mutate({ productId });
		},
		[checkout]
	);

	const handleArmShield = useCallback(() => {
		armShield.mutate();
	}, [armShield]);

	const items = catalog.data?.items ?? [];
	const hasShields = (inventory.data?.timeShields ?? 0) > 0;
	const armed = inventory.data?.timeShieldArmed ?? false;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<Reveal>
				<div className="mb-6">
					<h1 className="font-display font-extrabold text-2xl tracking-tight">
						Shop
					</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Points top-ups and Time Shields. Purchases are non-refundable and
						never redeemable for cash.
					</p>
				</div>
			</Reveal>

			{inventory.data ? (
				<Reveal index={1}>
					<Card className="mb-6 border-primary/30 bg-primary/5">
						<CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle className="text-base">
									Time Shields: {inventory.data.timeShields}
								</CardTitle>
								<CardDescription>
									{armed
										? "Armed — your next ring lasts 15s longer."
										: "Arm a shield so you get more time to answer."}
								</CardDescription>
							</div>
							<Button
								className="rounded-full"
								disabled={armed || !hasShields}
								onClick={handleArmShield}
								variant="outline"
							>
								{armed ? "Armed" : "Arm shield"}
							</Button>
						</CardContent>
					</Card>
				</Reveal>
			) : null}

			<div className="grid gap-4 sm:grid-cols-2">
				{items.map((item, index) => (
					<Reveal index={index + 2} key={item.productId}>
						<Card className="transition-shadow hover:shadow-lg">
							<CardHeader>
								<CardTitle className="text-base">
									{item.kind === "points_pack"
										? `${item.points.toLocaleString()} points`
										: "Time Shield (×3)"}
								</CardTitle>
								<CardDescription>
									{item.kind === "points_pack"
										? "Add points to your balance."
										: "+15s on your next incoming ring."}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex items-center justify-between">
								<span className="font-semibold text-foreground text-lg">
									${(item.priceCents / 100).toFixed(2)}
								</span>
								<Button
									className="rounded-full"
									disabled={checkout.isPending}
									onClick={() => handleBuy(item.productId)}
								>
									{checkout.isPending ? "Opening checkout…" : "Buy"}
								</Button>
							</CardContent>
						</Card>
					</Reveal>
				))}
			</div>

			<p className="mt-6 text-muted-foreground text-xs">
				Payments are handled securely by Polar. On iOS and Android, purchases go
				through the Apple App Store / Google Play billing instead.
			</p>
		</div>
	);
}
