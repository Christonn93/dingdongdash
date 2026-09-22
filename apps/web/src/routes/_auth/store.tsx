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

import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/store")({
	component: StoreRoute,
});

function StoreRoute() {
	const catalog = useQuery(trpc.purchases.getCatalog.queryOptions());
	const inventory = useQuery(trpc.users.getInventory.queryOptions());

	const purchase = useMutation(
		trpc.purchases.validateReceipt.mutationOptions({
			onSuccess: (result) => {
				toast.success(
					result.alreadyProcessed
						? "Purchase already processed"
						: "Purchase granted!"
				);
				inventory.refetch();
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
			// Development purchase: real store receipts are wired via IAP in the
			// native app; this lets the server flow be exercised end-to-end.
			purchase.mutate({
				platform: "ios",
				productId,
				platformTransactionId: crypto.randomUUID(),
				receiptData: "dev-receipt",
			});
		},
		[purchase]
	);

	const handleArmShield = useCallback(() => {
		armShield.mutate();
	}, [armShield]);

	const items = catalog.data?.items ?? [];
	const hasShields = (inventory.data?.timeShields ?? 0) > 0;
	const armed = inventory.data?.timeShieldArmed ?? false;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8">
			<div className="mb-6">
				<h1 className="font-semibold text-2xl text-foreground tracking-tight">
					Shop
				</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Points top-ups and Time Shields. Purchases are non-refundable and
					never redeemable for cash.
				</p>
			</div>

			{inventory.data ? (
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
							disabled={armed || !hasShields}
							onClick={handleArmShield}
							variant="outline"
						>
							{armed ? "Armed" : "Arm shield"}
						</Button>
					</CardContent>
				</Card>
			) : null}

			<div className="grid gap-4 sm:grid-cols-2">
				{items.map((item) => (
					<Card key={item.productId}>
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
								disabled={purchase.isPending}
								// biome-ignore lint/performance/noJsxPropsBind: per-product buy action
								onClick={() => handleBuy(item.productId)}
							>
								Buy
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<p className="mt-6 text-muted-foreground text-xs">
				In the production app, purchases go through Apple App Store / Google
				Play billing and are validated server-side before points are granted.
			</p>
		</div>
	);
}
