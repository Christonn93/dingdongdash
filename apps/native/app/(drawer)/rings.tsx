import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Spinner, Surface, useThemeColor } from "heroui-native";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { Container } from "@/components/container";
import { DoorbellButton } from "@/components/door/doorbell-button";
import { ErrorState } from "@/components/game/screen-states";
import { trpc } from "@/utils/trpc";

type RingStatus = "caught" | "ditched" | "pending";

const STATUS_META: Record<
	RingStatus,
	{
		label: string;
		icon: "checkmark" | "close" | "time";
		color: "success" | "danger" | "accent";
	}
> = {
	caught: { color: "success", icon: "checkmark", label: "Caught" },
	ditched: { color: "danger", icon: "close", label: "Ditched" },
	pending: { color: "accent", icon: "time", label: "Ringing" },
};

export default function RingsScreen() {
	const mutedColor = useThemeColor("muted");
	const accentColor = useThemeColor("accent");
	const successColor = useThemeColor("success");
	const dangerColor = useThemeColor("danger");

	const active = useQuery(
		trpc.rings.getActive.queryOptions(undefined, { refetchInterval: 3000 })
	);
	const history = useQuery(
		trpc.rings.getHistory.queryOptions({ cursor: undefined, limit: 20 })
	);

	const activeRings = active.data?.rings ?? [];
	const entries = history.data?.entries ?? [];

	const statusColor = (status: RingStatus) => {
		if (status === "caught") {
			return successColor;
		}
		if (status === "ditched") {
			return dangerColor;
		}
		return accentColor;
	};

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 py-2">
					<Text className="font-black text-3xl text-foreground tracking-tight">
						Your doorbell
					</Text>
					<Text className="mt-1 text-muted text-sm">
						Every ring, catch and ditch — logged.
					</Text>
				</View>

				{activeRings.length > 0 ? (
					<View className="mb-6">
						<Text className="mb-2 font-bold text-foreground">Incoming now</Text>
						<View className="gap-2">
							{activeRings.map((ring) => (
								<Animated.View
									entering={FadeInDown.springify().damping(14)}
									key={ring.id}
								>
									<View
										style={{
											backgroundColor: accentColor,
											borderRadius: 20,
											boxShadow: "0 10px 26px rgba(249,115,22,0.4)",
											padding: 16,
										}}
									>
										<View className="flex-row items-center gap-3">
											<Animated.View
												entering={ZoomIn.springify()}
												style={{
													alignItems: "center",
													backgroundColor: "rgba(255,255,255,0.22)",
													borderRadius: 22,
													height: 44,
													justifyContent: "center",
													width: 44,
												}}
											>
												<Ionicons color="#fff" name="notifications" size={24} />
											</Animated.View>
											<View className="flex-1">
												<Text className="font-extrabold text-base text-white">
													{ring.ringer.name} is at your door
												</Text>
												<Text className="text-white/85 text-xs">
													Answer before the timer runs out
												</Text>
											</View>
										</View>
										<View className="mt-3">
											<DoorbellButton
												icon="bell-ringing"
												label="Open the door"
												onPress={() => router.push(`/ring/${ring.id}`)}
												size="md"
												variant="secondary"
											/>
										</View>
									</View>
								</Animated.View>
							))}
						</View>
					</View>
				) : null}

				<Text className="mb-2 font-bold text-foreground">History</Text>

				{history.isLoading ? (
					<View className="items-center py-10">
						<Spinner size="lg" />
					</View>
				) : null}

				{history.isError ? (
					<ErrorState
						message="We couldn't load your doorbell log."
						onRetry={() => history.refetch()}
					/>
				) : null}

				{!(history.isLoading || history.isError) && entries.length === 0 ? (
					<Surface
						className="items-center rounded-2xl py-10"
						variant="secondary"
					>
						<Ionicons
							color={mutedColor}
							name="notifications-off-outline"
							size={40}
						/>
						<Text className="mt-3 font-semibold text-foreground">
							No rings yet
						</Text>
						<Text className="mt-1 text-muted text-xs">
							Ring a friend from the Friends tab to get started
						</Text>
					</Surface>
				) : null}

				{entries.length > 0 ? (
					<View className="gap-2">
						{entries.map((entry, index) => {
							const status = entry.status as RingStatus;
							const meta = STATUS_META[status];
							const color = statusColor(status);
							return (
								<Animated.View
									entering={FadeInDown.delay(index * 25).duration(280)}
									key={entry.id}
								>
									<Surface className="rounded-2xl p-3" variant="secondary">
										<View className="flex-row items-center gap-3">
											<View
												style={{
													alignItems: "center",
													backgroundColor: `${color}22`,
													borderRadius: 19,
													height: 38,
													justifyContent: "center",
													width: 38,
												}}
											>
												<Ionicons color={color} name={meta.icon} size={20} />
											</View>
											<View className="flex-1">
												<Text className="font-semibold text-foreground text-sm capitalize">
													{meta.label}
												</Text>
												<Text className="text-muted text-xs">
													{timeAgo(new Date(entry.createdAt))}
												</Text>
											</View>
											<View
												style={{
													backgroundColor: `${color}1f`,
													borderRadius: 999,
													paddingHorizontal: 10,
													paddingVertical: 4,
												}}
											>
												<Text className="font-bold text-xs" style={{ color }}>
													{statusPointsLabel(status)}
												</Text>
											</View>
										</View>
									</Surface>
								</Animated.View>
							);
						})}
					</View>
				) : null}

				<View style={{ height: 8 }} />
				<View className="flex-row items-center justify-center gap-1.5 py-4">
					<Ionicons color={mutedColor} name="time-outline" size={13} />
					<Text className="text-muted text-xs">
						Timers are authoritative on the server.
					</Text>
				</View>
			</ScrollView>
		</Container>
	);
}

function timeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) {
		return "just now";
	}
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) {
		return `${minutes}m ago`;
	}
	const hours = Math.floor(minutes / 60);
	if (hours < 24) {
		return `${hours}h ago`;
	}
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function statusPointsLabel(status: RingStatus): string {
	if (status === "caught") {
		return "+10 / −5";
	}
	if (status === "ditched") {
		return "−10";
	}
	return "…";
}
