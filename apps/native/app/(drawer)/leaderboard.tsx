import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

type Scope = "friends" | "global";

interface Row {
	id: string;
	name: string;
	points: number;
	rank: number;
}

const MEDALS = ["#f5c518", "#c0c0c0", "#cd7f32"];

export default function LeaderboardScreen() {
	const mutedColor = useThemeColor("muted");
	const foregroundColor = useThemeColor("foreground");
	const accentColor = useThemeColor("accent");
	const surfaceColor = useThemeColor("surface");
	const borderColor = useThemeColor("border");

	const [scope, setScope] = useState<Scope>("friends");
	const [offset, setOffset] = useState(0);

	const friends = useQuery(trpc.leaderboard.getFriends.queryOptions());
	const global = useQuery(
		trpc.leaderboard.getGlobal.queryOptions({ cursor: 0, limit: 25 })
	);
	const more = useQuery(
		trpc.leaderboard.getGlobal.queryOptions(
			{ cursor: offset + 25, limit: 25 },
			{ enabled: offset > 0 }
		)
	);

	const me = friends.data?.me;
	const rows: Row[] =
		scope === "friends"
			? (friends.data?.entries ?? [])
			: [...(global.data?.entries ?? []), ...(more.data?.entries ?? [])];
	const loading =
		scope === "friends" ? friends.isLoading : global.isLoading && offset === 0;

	const podium = rows.slice(0, 3);
	const rest = rows.slice(3);

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 py-2">
					<Text className="font-black text-3xl text-foreground tracking-tight">
						Leaderboard
					</Text>
					<Text className="mt-1 text-muted text-sm">
						{me
							? `You're #${me.rank ?? "?"} among friends, #${me.globalRank} globally.`
							: "Climb the ranks — every catch counts."}
					</Text>
				</View>

				{/* Scope toggle */}
				<View
					style={{
						backgroundColor: surfaceColor,
						borderColor,
						borderRadius: 999,
						borderWidth: 1,
						flexDirection: "row",
						marginBottom: 16,
						padding: 4,
					}}
				>
					{(["friends", "global"] as const).map((s) => {
						const active = scope === s;
						return (
							<Pressable
								key={s}
								onPress={() => setScope(s)}
								style={{
									alignItems: "center",
									backgroundColor: active ? accentColor : "transparent",
									borderRadius: 999,
									flex: 1,
									paddingVertical: 9,
								}}
							>
								<Text
									className="font-bold text-sm capitalize"
									style={{ color: active ? "#fff" : mutedColor }}
								>
									{s}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{loading ? (
					<View className="items-center py-12">
						<Spinner size="lg" />
					</View>
				) : null}

				{!loading && rows.length === 0 ? (
					<Surface
						className="items-center rounded-2xl py-10"
						variant="secondary"
					>
						<Ionicons color={mutedColor} name="podium-outline" size={40} />
						<Text className="mt-3 font-semibold text-foreground">
							No rankings yet
						</Text>
						<Text className="mt-1 text-muted text-xs">
							Ring some friends to start climbing
						</Text>
					</Surface>
				) : null}

				{!loading && podium.length > 0 ? (
					<View
						style={{
							alignItems: "flex-end",
							flexDirection: "row",
							gap: 10,
							marginBottom: 16,
						}}
					>
						<PodiumColumn
							entry={podium[1]}
							height={120}
							medal={MEDALS[1]}
							meId={me?.id}
						/>
						<PodiumColumn
							entry={podium[0]}
							height={160}
							medal={MEDALS[0]}
							meId={me?.id}
						/>
						<PodiumColumn
							entry={podium[2]}
							height={100}
							medal={MEDALS[2]}
							meId={me?.id}
						/>
					</View>
				) : null}

				{rest.length > 0 ? (
					<Surface className="rounded-2xl p-1" variant="secondary">
						{rest.map((entry, index) => {
							const isMe = entry.id === me?.id;
							return (
								<Animated.View
									entering={FadeInDown.delay(index * 20).duration(250)}
									key={entry.id}
								>
									<View
										style={{
											alignItems: "center",
											backgroundColor: isMe
												? "rgba(249,115,22,0.10)"
												: "transparent",
											borderRadius: 14,
											flexDirection: "row",
											justifyContent: "space-between",
											paddingHorizontal: 12,
											paddingVertical: 11,
										}}
									>
										<View
											style={{
												alignItems: "center",
												flexDirection: "row",
												gap: 12,
											}}
										>
											<Text
												className="w-6 text-center font-bold text-sm"
												style={{ color: mutedColor }}
											>
												{entry.rank}
											</Text>
											<View
												style={{
													alignItems: "center",
													backgroundColor: isMe
														? accentColor
														: `${mutedColor}33`,
													borderRadius: 17,
													height: 34,
													justifyContent: "center",
													width: 34,
												}}
											>
												<Text
													className="font-extrabold text-sm"
													style={{ color: isMe ? "#fff" : foregroundColor }}
												>
													{entry.name.charAt(0).toUpperCase()}
												</Text>
											</View>
											<Text className="font-semibold text-foreground text-sm">
												{entry.name}
												{isMe ? " (you)" : ""}
											</Text>
										</View>
										<Text className="font-bold text-foreground text-sm">
											{entry.points.toLocaleString()}
										</Text>
									</View>
								</Animated.View>
							);
						})}
					</Surface>
				) : null}

				{scope === "global" && global.data?.nextCursor ? (
					<Button
						className="mt-4"
						onPress={() => setOffset(rows.length)}
						variant="secondary"
					>
						<Button.Label>Load more</Button.Label>
					</Button>
				) : null}
			</ScrollView>
		</Container>
	);
}

function PodiumColumn({
	entry,
	medal,
	height,
	meId,
}: {
	entry?: Row;
	medal: string;
	height: number;
	meId?: string;
}) {
	const mutedColor = useThemeColor("muted");
	const surfaceColor = useThemeColor("surface");
	const borderColor = useThemeColor("border");
	const foregroundColor = useThemeColor("foreground");
	const accentColor = useThemeColor("accent");

	return (
		<Animated.View
			entering={FadeInDown.springify().damping(15)}
			style={{ alignItems: "center", flex: 1 }}
		>
			<View
				style={{
					alignItems: "center",
					backgroundColor: medal,
					borderColor: "#fff",
					borderRadius: 23,
					borderWidth: 3,
					height: 46,
					justifyContent: "center",
					marginBottom: 8,
					width: 46,
				}}
			>
				<Text className="font-black text-black/80 text-lg">
					{entry?.name.charAt(0).toUpperCase() ?? "?"}
				</Text>
			</View>
			<Text
				className="mb-1 max-w-[80%] font-bold text-sm"
				numberOfLines={1}
				style={{ color: foregroundColor }}
			>
				{entry?.name ?? "—"}
			</Text>
			<Text
				className="mb-3 font-semibold text-xs"
				style={{ color: mutedColor }}
			>
				{entry ? entry.points.toLocaleString() : ""}
			</Text>
			<View
				style={{
					alignItems: "center",
					backgroundColor: entry?.id === meId ? accentColor : surfaceColor,
					borderColor,
					borderRadius: 14,
					borderWidth: 1,
					height,
					justifyContent: "flex-end",
					paddingBottom: 10,
					width: "100%",
				}}
			>
				<Text
					className="font-black text-2xl"
					style={{ color: entry?.id === meId ? "#fff" : mutedColor }}
				>
					{entry?.rank ?? "—"}
				</Text>
			</View>
		</Animated.View>
	);
}
