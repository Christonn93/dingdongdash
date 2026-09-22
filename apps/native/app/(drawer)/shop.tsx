import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	Chip,
	Spinner,
	Surface,
	useThemeColor,
	useToast,
} from "heroui-native";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

export default function ShopScreen() {
	const { toast } = useToast();
	const mutedColor = useThemeColor("muted");

	const catalog = useQuery(trpc.purchases.getCatalog.queryOptions());
	const inventory = useQuery(trpc.users.getInventory.queryOptions());

	const purchase = useMutation(
		trpc.purchases.validateReceipt.mutationOptions({
			onError: (error) => {
				toast.show({ label: error.message, variant: "danger" });
			},
			onSuccess: (result) => {
				toast.show({
					label: result.alreadyProcessed
						? "Already processed"
						: "Purchase granted!",
					variant: "success",
				});
				inventory.refetch();
			},
		})
	);

	const armShield = useMutation(
		trpc.users.armTimeShield.mutationOptions({
			onError: (error) => {
				toast.show({ label: error.message, variant: "danger" });
			},
			onSuccess: () => {
				toast.show({
					label: "Shield armed — +15s on your next ring",
					variant: "success",
				});
				inventory.refetch();
			},
		})
	);

	const handleBuy = useCallback(
		(productId: string) => {
			purchase.mutate({
				platform: "ios",
				platformTransactionId: crypto.randomUUID(),
				productId,
				receiptData: "dev-receipt",
			});
		},
		[purchase]
	);

	const items = catalog.data?.items ?? [];
	const hasShields = (inventory.data?.timeShields ?? 0) > 0;
	const armed = inventory.data?.timeShieldArmed ?? false;

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 py-2">
					<Text className="font-semibold text-2xl text-foreground tracking-tight">
						Shop
					</Text>
					<Text className="mt-1 text-muted text-sm">
						Points top-ups and Time Shields. Never redeemable for cash.
					</Text>
				</View>

				{inventory.data ? (
					<Surface
						className="mb-4 rounded-lg border border-primary/30 p-4"
						variant="secondary"
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<Text className="font-medium text-foreground">
									Time Shields: {inventory.data.timeShields}
								</Text>
								<Text className="mt-1 text-muted text-xs">
									{armed
										? "Armed — your next ring lasts 15s longer."
										: "Arm a shield for more time to answer."}
								</Text>
							</View>
							<Button
								isDisabled={armed || !hasShields}
								onPress={() => armShield.mutate()}
								size="sm"
								variant="secondary"
							>
								<Button.Label>{armed ? "Armed" : "Arm"}</Button.Label>
							</Button>
						</View>
					</Surface>
				) : null}

				{catalog.isLoading ? (
					<View className="items-center py-12">
						<Spinner size="lg" />
					</View>
				) : (
					<View className="gap-3">
						{items.map((item) => (
							<Surface
								className="rounded-lg p-4"
								key={item.productId}
								variant="secondary"
							>
								<View className="flex-row items-center justify-between">
									<View className="flex-1">
										<Text className="font-medium text-foreground">
											{item.kind === "points_pack"
												? `${item.points.toLocaleString()} points`
												: "Time Shield (×3)"}
										</Text>
										<Text className="mt-1 text-muted text-xs">
											{item.kind === "points_pack"
												? "Add points to your balance."
												: "+15s on your next incoming ring."}
										</Text>
									</View>
									<View className="items-end gap-2">
										<Chip color="accent" size="sm" variant="secondary">
											<Chip.Label>
												${(item.priceCents / 100).toFixed(2)}
											</Chip.Label>
										</Chip>
										<Button
											isDisabled={purchase.isPending}
											onPress={() => handleBuy(item.productId)}
											size="sm"
										>
											<Button.Label>Buy</Button.Label>
										</Button>
									</View>
								</View>
							</Surface>
						))}
					</View>
				)}

				<View className="mt-6 flex-row items-center gap-2 px-1">
					<Ionicons
						color={mutedColor}
						name="information-circle-outline"
						size={16}
					/>
					<Text className="flex-1 text-muted text-xs">
						Production purchases use Apple App Store / Google Play billing with
						server-side receipt validation.
					</Text>
				</View>
			</ScrollView>
		</Container>
	);
}
