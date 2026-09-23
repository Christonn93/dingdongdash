import {
	DOOR_SKINS,
	type DoorSkinTheme,
} from "@dingdongdash/api/lib/door-catalog";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	Spinner,
	Surface,
	useThemeColor,
	useToast,
} from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { DoorScene } from "@/components/door/door";
import { PointsBadge } from "@/components/door/points-badge";
import { playRingSound, playSoundById } from "@/lib/sound";
import { trpc } from "@/utils/trpc";

export default function HouseScreen() {
	const { toast } = useToast();
	const mutedColor = useThemeColor("muted");
	const accentColor = useThemeColor("accent");
	const borderColor = useThemeColor("border");
	const [previewSkinId, setPreviewSkinId] = useState<string | null>(null);

	const catalog = useQuery(trpc.doors.getCatalog.queryOptions());
	const me = useQuery(trpc.users.me.queryOptions());

	const buyDoor = useMutation(
		trpc.doors.buyDoor.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: () => {
				toast.show({
					label: "Door added to your collection!",
					variant: "success",
				});
				catalog.refetch();
				me.refetch();
			},
		})
	);
	const equipDoor = useMutation(
		trpc.doors.equipDoor.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: () => {
				toast.show({
					label: "Door equipped — new look!",
					variant: "success",
				});
				catalog.refetch();
				me.refetch();
			},
		})
	);
	const buyUpgrade = useMutation(
		trpc.doors.buyUpgrade.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: (_result, { upgradeId }) => {
				toast.show({
					label:
						upgradeId === "camera_doorbell"
							? "Camera doorbell installed — you'll see who's ringing!"
							: "Spy camera installed above your door.",
					variant: "success",
				});
				catalog.refetch();
				me.refetch();
			},
		})
	);
	const buySound = useMutation(
		trpc.doors.buySound.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: () => {
				toast.show({
					label: "Sound added to your collection!",
					variant: "success",
				});
				catalog.refetch();
				me.refetch();
			},
		})
	);
	const equipSound = useMutation(
		trpc.doors.equipSound.mutationOptions({
			onError: (error) =>
				toast.show({ label: error.message, variant: "danger" }),
			onSuccess: () => {
				toast.show({
					label: "Sound equipped — that's what ringers will hear!",
					variant: "success",
				});
				catalog.refetch();
				me.refetch();
			},
		})
	);

	const equippedId = catalog.data?.doorSkinId ?? "classic";
	const equipped =
		DOOR_SKINS.find((skin) => skin.id === equippedId) ?? DOOR_SKINS[0];
	const preview =
		DOOR_SKINS.find((skin) => skin.id === (previewSkinId ?? equippedId)) ??
		DOOR_SKINS[0];
	const points = me.data?.user.points ?? 0;
	const loading = catalog.isLoading || me.isLoading;
	const cameraDoorbell = catalog.data?.cameraDoorbell ?? false;

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 flex-row items-end justify-between">
					<View className="flex-1">
						<Text className="font-black text-3xl text-foreground tracking-tight">
							My House
						</Text>
						<Text className="mt-1 text-muted text-sm">
							Your door, your wall, your style.
						</Text>
					</View>
					<PointsBadge points={points} size="sm" />
				</View>

				{loading ? (
					<View className="items-center py-12">
						<Spinner size="lg" />
					</View>
				) : (
					<>
						{/* Live preview */}
						<Surface
							className="items-center overflow-hidden rounded-3xl py-6"
							style={{ borderColor, borderWidth: 1 }}
						>
							<DoorScene
								cameraDoorbell={cameraDoorbell}
								disabled
								idleAction="ring"
								onRing={() => playRingSound(preview.theme.bellStyle)}
								phase="idle"
								size={320}
								skin={preview.theme}
								spyCamera={catalog.data?.spyCamera ?? false}
							/>
							<Text className="mt-2 text-center text-muted text-xs">
								Tap the bell to hear {preview.name}
							</Text>
							{preview.id === equipped.id ? null : (
								<Text
									className="mt-1 text-center text-xs"
									style={{ color: accentColor }}
								>
									Previewing “{preview.name}” — tap a door below to switch
								</Text>
							)}
						</Surface>

						{/* Doors */}
						<Text className="mt-6 mb-2 font-extrabold text-foreground text-lg">
							Doors
						</Text>
						<Text className="mb-3 text-muted text-sm">
							Each door brings its own wall and its own way to announce you.
						</Text>
						<View style={{ gap: 12 }}>
							{catalog.data?.skins.map((skin) => {
								const theme = DOOR_SKINS.find((s) => s.id === skin.id)?.theme;
								if (!theme) {
									return null;
								}
								return (
									<DoorCard
										accentColor={accentColor}
										borderColor={borderColor}
										buying={buyDoor.isPending || equipDoor.isPending}
										canAfford={points >= skin.pricePoints}
										equipped={skin.equipped}
										key={skin.id}
										mutedColor={mutedColor}
										onAction={() =>
											skin.owned
												? equipDoor.mutate({ doorSkinId: skin.id })
												: buyDoor.mutate({ doorSkinId: skin.id })
										}
										onPreview={() => {
											setPreviewSkinId(skin.id);
											playRingSound(theme.bellStyle);
										}}
										owned={skin.owned}
										previewing={preview.id === skin.id}
										pricePoints={skin.pricePoints}
										theme={theme}
										title={skin.name}
									/>
								);
							})}
						</View>

						{/* Upgrades */}
						<Text className="mt-6 mb-2 font-extrabold text-foreground text-lg">
							Upgrades
						</Text>
						<Text className="mb-3 text-muted text-sm">
							A camera doorbell reveals who's ringing. Without one, ringers stay
							a mystery.
						</Text>
						<View style={{ gap: 12 }}>
							{catalog.data?.upgrades.map((upgrade) => (
								<UpgradeCard
									accentColor={accentColor}
									borderColor={borderColor}
									buying={buyUpgrade.isPending}
									canAfford={points >= upgrade.pricePoints}
									description={upgrade.description}
									installed={upgrade.owned}
									key={upgrade.id}
									mutedColor={mutedColor}
									onInstall={() => buyUpgrade.mutate({ upgradeId: upgrade.id })}
									pricePoints={upgrade.pricePoints}
									title={upgrade.name}
								/>
							))}
						</View>

						{/* Ring sounds */}
						<Text className="mt-6 mb-2 font-extrabold text-foreground text-lg">
							Ring sounds
						</Text>
						<Text className="mb-3 text-muted text-sm">
							This is what ringers hear when they knock on your door.
						</Text>
						<View style={{ gap: 12 }}>
							{catalog.data?.sounds.map((sound) => (
								<SoundCard
									accentColor={accentColor}
									borderColor={borderColor}
									buying={buySound.isPending || equipSound.isPending}
									canAfford={points >= sound.pricePoints}
									description={sound.description}
									equipped={sound.equipped}
									key={sound.id}
									mutedColor={mutedColor}
									onAction={() =>
										sound.owned
											? equipSound.mutate({ soundId: sound.id })
											: buySound.mutate({ soundId: sound.id })
									}
									owned={sound.owned}
									pricePoints={sound.pricePoints}
									soundId={sound.id}
									title={sound.name}
								/>
							))}
						</View>
					</>
				)}
			</ScrollView>
		</Container>
	);
}

function DoorCard({
	title,
	pricePoints,
	owned,
	equipped,
	previewing,
	canAfford,
	buying,
	theme,
	accentColor,
	borderColor,
	mutedColor,
	onAction,
	onPreview,
}: {
	title: string;
	pricePoints: number;
	owned: boolean;
	equipped: boolean;
	previewing: boolean;
	canAfford: boolean;
	buying: boolean;
	theme: DoorSkinTheme;
	accentColor: string;
	borderColor: string;
	mutedColor: string;
	onAction: () => void;
	onPreview: () => void;
}) {
	let actionLabel = `${pricePoints.toLocaleString()} pts`;
	if (equipped) {
		actionLabel = "Equipped";
	} else if (owned) {
		actionLabel = "Equip";
	}

	return (
		<Surface
			className="overflow-hidden rounded-2xl"
			style={{ borderColor, borderWidth: previewing ? 2 : 1 }}
		>
			<Pressable
				accessibilityLabel={`Preview the ${title} door`}
				onPress={onPreview}
				style={{
					alignItems: "center",
					backgroundColor: theme.wall.from,
					justifyContent: "flex-end",
					paddingVertical: 12,
				}}
			>
				<View className="h-28 w-16">
					<DoorScene
						disabled
						phase="closed"
						size={90}
						skin={theme}
						style={{ height: 112, width: 64 }}
					/>
				</View>
				<Text className="mt-1 pb-1 text-xs" style={{ color: mutedColor }}>
					Tap to hear & preview
				</Text>
			</Pressable>
			<View className="p-4">
				<View className="mb-1 flex-row items-center justify-between">
					<Text className="font-extrabold text-base text-foreground">
						{title}
					</Text>
					{equipped ? (
						<Text className="font-bold text-xs" style={{ color: accentColor }}>
							On your house
						</Text>
					) : null}
				</View>
				<Button
					isDisabled={buying || equipped}
					onPress={onAction}
					size="md"
					variant={owned ? "secondary" : "primary"}
				>
					<Button.Label>{actionLabel}</Button.Label>
				</Button>
				{owned || canAfford ? null : (
					<Text
						className="mt-2 text-center text-xs"
						style={{ color: mutedColor }}
					>
						Not enough points yet
					</Text>
				)}
			</View>
		</Surface>
	);
}

function UpgradeCard({
	title,
	description,
	pricePoints,
	installed,
	canAfford,
	buying,
	accentColor,
	borderColor,
	mutedColor,
	onInstall,
}: {
	title: string;
	description: string;
	pricePoints: number;
	installed: boolean;
	canAfford: boolean;
	buying: boolean;
	accentColor: string;
	borderColor: string;
	mutedColor: string;
	onInstall: () => void;
}) {
	return (
		<Surface
			className="rounded-2xl p-4"
			style={{ borderColor, borderWidth: 1 }}
		>
			<View className="mb-1 flex-row items-center justify-between">
				<Text className="font-extrabold text-base text-foreground">
					{title}
				</Text>
				{installed ? (
					<Ionicons color={accentColor} name="checkmark-circle" size={20} />
				) : null}
			</View>
			<Text className="mb-3 text-muted text-sm">{description}</Text>
			<Button
				isDisabled={buying || installed}
				onPress={onInstall}
				variant={installed ? "secondary" : "primary"}
			>
				<Button.Label>
					{installed
						? "Installed"
						: `Buy · ${pricePoints.toLocaleString()} pts`}
				</Button.Label>
			</Button>
			{installed || canAfford ? null : (
				<Text
					className="mt-2 text-center text-xs"
					style={{ color: mutedColor }}
				>
					Not enough points yet
				</Text>
			)}
		</Surface>
	);
}

function SoundCard({
	title,
	description,
	pricePoints,
	owned,
	equipped,
	canAfford,
	buying,
	soundId,
	accentColor,
	borderColor,
	mutedColor,
	onAction,
}: {
	title: string;
	description: string;
	pricePoints: number;
	owned: boolean;
	equipped: boolean;
	canAfford: boolean;
	buying: boolean;
	soundId: string;
	accentColor: string;
	borderColor: string;
	mutedColor: string;
	onAction: () => void;
}) {
	let actionLabel = `${pricePoints.toLocaleString()} pts`;
	if (equipped) {
		actionLabel = "Your sound";
	} else if (owned) {
		actionLabel = "Equip";
	}

	return (
		<Surface
			className="rounded-2xl p-4"
			style={{ borderColor, borderWidth: 1 }}
		>
			<View className="mb-1 flex-row items-center justify-between">
				<Text className="font-extrabold text-base text-foreground">
					🔔 {title}
				</Text>
				{equipped ? (
					<Ionicons color={accentColor} name="musical-notes" size={20} />
				) : null}
			</View>
			<Text className="mb-3 text-muted text-sm">{description}</Text>
			<View style={{ flexDirection: "row", gap: 10 }}>
				<Button
					onPress={() => playSoundById(soundId)}
					style={{ flex: 1 }}
					variant="secondary"
				>
					<Button.Label>▶ Preview</Button.Label>
				</Button>
				<Button
					isDisabled={buying || equipped}
					onPress={onAction}
					style={{ flex: 1 }}
					variant={owned ? "secondary" : "primary"}
				>
					<Button.Label>{actionLabel}</Button.Label>
				</Button>
			</View>
			{owned || canAfford ? null : (
				<Text
					className="mt-2 text-center text-xs"
					style={{ color: mutedColor }}
				>
					Not enough points yet
				</Text>
			)}
		</Surface>
	);
}
