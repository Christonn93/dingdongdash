import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Surface, useThemeColor, useToast } from "heroui-native";
import { useCallback } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DoorbellButton } from "@/components/door/doorbell-button";
import { readContactPhoneHashes } from "@/lib/contacts";
import { trpc } from "@/utils/trpc";

/**
 * Add a friend — the front door for growing your neighborhood.
 * Invite by link or sync your contacts to find friends instantly.
 */

function AddFriendModal() {
	const insets = useSafeAreaInsets();
	const { toast } = useToast();
	const accent = useThemeColor("accent");
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");
	const background = useThemeColor("background");

	const inviteMutation = useMutation(
		trpc.friends.createInvite.mutationOptions()
	);
	const importMutation = useMutation(
		trpc.friends.importContacts.mutationOptions({
			onError: (error) => {
				toast.show({ label: error.message, variant: "danger" });
			},
			onSuccess: () => {
				toast.show({ label: "Contacts synced", variant: "success" });
				router.back();
			},
		})
	);

	const handleInvite = useCallback(async () => {
		try {
			const invite = await inviteMutation.mutateAsync();
			await Share.share({
				message: `Join me on DingDongDitch so we can ring each other: ${invite.url}`,
				title: "Join me on DingDongDitch",
				url: invite.url,
			});
			router.back();
		} catch (error) {
			toast.show({
				label:
					error instanceof Error ? error.message : "Could not create invite",
				variant: "danger",
			});
		}
	}, [inviteMutation, toast]);

	const handleImport = useCallback(async () => {
		try {
			const hashes = await readContactPhoneHashes();
			if (hashes.length === 0) {
				toast.show({ label: "No contacts found", variant: "default" });
				return;
			}
			importMutation.mutate({ hashes });
		} catch (error) {
			toast.show({
				label:
					error instanceof Error ? error.message : "Could not read contacts",
				variant: "danger",
			});
		}
	}, [importMutation, toast]);

	const goBack = useCallback(() => router.back(), []);

	return (
		<View
			style={{
				backgroundColor: background,
				flex: 1,
				paddingTop: insets.top + 8,
			}}
		>
			<View className="flex-row items-center justify-between px-4">
				<Pressable
					accessibilityLabel="Close"
					hitSlop={12}
					onPress={goBack}
					style={({ pressed }) => ({
						alignItems: "center",
						backgroundColor: "rgba(127,127,127,0.18)",
						borderRadius: 20,
						height: 40,
						justifyContent: "center",
						opacity: pressed ? 0.6 : 1,
						width: 40,
					})}
				>
					<Ionicons color={foreground} name="close" size={22} />
				</Pressable>
				<Text className="font-bold text-base" style={{ color: foreground }}>
					Add a friend
				</Text>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="items-center py-6">
					<View
						style={{
							alignItems: "center",
							backgroundColor: accent,
							borderRadius: 28,
							height: 56,
							justifyContent: "center",
							marginBottom: 14,
							width: 56,
						}}
					>
						<Ionicons color="#fff" name="people" size={28} />
					</View>
					<Text
						className="text-center font-black text-2xl tracking-tight"
						style={{ color: foreground }}
					>
						Grow your neighborhood
					</Text>
					<Text className="mt-2 text-center text-sm" style={{ color: muted }}>
						Ringing needs mutual friends. Add a few and the doorbell starts
						ringing.
					</Text>
				</View>

				<View className="gap-3">
					<Surface className="rounded-2xl p-4" variant="secondary">
						<View className="flex-row items-center gap-3">
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
								<Ionicons color={accent} name="link" size={24} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-foreground">
									Invite by link
								</Text>
								<Text className="mt-0.5 text-muted text-xs">
									Share a link — when they join, you're friends.
								</Text>
							</View>
						</View>
						<View className="mt-3">
							<DoorbellButton
								disabled={inviteMutation.isPending}
								icon="link"
								label={inviteMutation.isPending ? "Creating…" : "Share invite"}
								onPress={handleInvite}
								size="md"
								variant="secondary"
							/>
						</View>
					</Surface>

					<Surface className="rounded-2xl p-4" variant="secondary">
						<View className="flex-row items-center gap-3">
							<View
								style={{
									alignItems: "center",
									backgroundColor: "rgba(252,211,77,0.18)",
									borderRadius: 14,
									height: 44,
									justifyContent: "center",
									width: 44,
								}}
							>
								<Ionicons color="#eab308" name="phone-portrait" size={24} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-foreground">Sync contacts</Text>
								<Text className="mt-0.5 text-muted text-xs">
									Find friends who already have you saved. Stored as one-way
									hashes.
								</Text>
							</View>
						</View>
						<View className="mt-3">
							<DoorbellButton
								disabled={importMutation.isPending}
								icon="people"
								label={importMutation.isPending ? "Syncing…" : "Find friends"}
								onPress={handleImport}
								size="md"
								variant="secondary"
							/>
						</View>
					</Surface>

					<Surface className="rounded-2xl p-4" variant="secondary">
						<View className="flex-row items-center gap-3">
							<View
								style={{
									alignItems: "center",
									backgroundColor: "rgba(67,232,164,0.16)",
									borderRadius: 14,
									height: 44,
									justifyContent: "center",
									width: 44,
								}}
							>
								<Ionicons color="#22c55e" name="shield-checkmark" size={24} />
							</View>
							<View className="flex-1">
								<Text className="font-bold text-foreground">Fair play</Text>
								<Text className="mt-0.5 text-muted text-xs">
									One ring per friend per hour. Do Not Disturb windows are
									always respected.
								</Text>
							</View>
						</View>
					</Surface>
				</View>
			</ScrollView>
		</View>
	);
}

export default AddFriendModal;
