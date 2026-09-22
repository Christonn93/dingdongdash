import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Chip, Spinner, Surface, useThemeColor, useToast } from "heroui-native";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { DoorbellButton } from "@/components/door/doorbell-button";
import { PointsBadge } from "@/components/door/points-badge";
import { ErrorState } from "@/components/game/screen-states";
import { trpc } from "@/utils/trpc";

export default function ShopScreen() {
	const { toast } = useToast();
	const mutedColor = useThemeColor("muted");
	const accentColor = useThemeColor("accent");

	const me = useQuery(trpc.users.me.queryOptions());
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
					<Text className="font-black text-3xl text-foreground tracking-tight">
						Shop
					</Text>
					<Text className="mt-1 text-muted text-sm">
						Points top-ups and Time Shields. Never redeemable for cash.
					</Text>
					<View className="mt-4 flex-row items-center gap-3">
						<View
							style={{
								alignItems: "center",
								backgroundColor: accentColor,
								borderRadius: 16,
								flexDirection: "row",
								gap: 12,
								paddingHorizontal: 14,
								paddingVertical: 8,
							}}
						>
							<PointsBadge points={me.data?.user.points ?? 1000} size="sm" />
						</View>
					</View>
				</View>

				{inventory.data ? (
					<Surface
						className="mb-4 rounded-2xl border border-accent/30 p-4"
						variant="secondary"
					>
						<View className="flex-row items-center justify-between gap-3">
							<View className="flex-1 flex-row items-center gap-3">
								<View
									style={{
										alignItems: "center",
										backgroundColor: "rgba(249,115,22,0.14)",
										borderRadius: 14,
										height: 44,
										justifyContent: "center",
										width: 44,
									}}
								>
									<Ionicons color={accentColor} name="flash" size={24} />
								</View>
								<View className="flex-1">
									<Text className="font-bold text-foreground">
										Time Shields: {inventory.data.timeShields}
									</Text>
									<Text className="mt-0.5 text-muted text-xs">
										{armed
											? "Armed — your next ring lasts 15s longer."
											: "Arm a shield for more time to answer."}
									</Text>
								</View>
							</View>
							<DoorbellButton
								disabled={armed || !hasShields}
								icon={armed ? "checkmark" : "bell"}
								label={armed ? "Armed" : "Arm"}
								onPress={() => armShield.mutate()}
								size="sm"
								variant="secondary"
							/>
						</View>
					</Surface>
				) : null}

				{catalog.isLoading ? (
					<View className="items-center py-12">
						<Spinner size="lg" />
					</View>
				) : catalog.isError ? (
					<ErrorState
						message="We couldn't load the shop catalog."
						onRetry={() => catalog.refetch()}
					/>
				) : (
					<View className="gap-3">
						{items.map((item) => {
							const isPoints = item.kind === "points_pack";
							return (
								<Surface
									className="rounded-2xl p-4"
									key={item.productId}
									variant="secondary"
								>
									<View className="flex-row items-center justify-between gap-3">
										<View className="flex-1 flex-row items-center gap-3">
											<View
												style={{
													alignItems: "center",
													backgroundColor: isPoints
														? "rgba(252,211,77,0.18)"
														: "rgba(249,115,22,0.14)",
													borderRadius: 14,
													height: 44,
													justifyContent: "center",
													width: 44,
												}}
											>
												<Ionicons
													color={isPoints ? "#eab308" : accentColor}
													name={isPoints ? "cash-outline" : "flash"}
													size={24}
												/>
											</View>
											<View className="flex-1">
												<Text className="font-bold text-foreground">
													{item.kind === "points_pack"
														? `${item.points.toLocaleString()} points`
														: "Time Shield (×3)"}
												</Text>
												<Text className="mt-0.5 text-muted text-xs">
													{item.kind === "points_pack"
														? "Add points to your balance."
														: "+15s on your next incoming ring."}
												</Text>
											</View>
										</View>
										<View className="items-end gap-2">
											<Chip color="accent" size="sm" variant="secondary">
												<Chip.Label>
													${(item.priceCents / 100).toFixed(2)}
												</Chip.Label>
											</Chip>
											<DoorbellButton
												disabled={purchase.isPending}
												icon="bell"
												label="Buy"
												onPress={() => handleBuy(item.productId)}
												size="sm"
												variant="secondary"
											/>
										</View>
									</View>
								</Surface>
							);
						})}
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
