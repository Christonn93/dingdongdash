import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

type Scope = "friends" | "global";

export default function LeaderboardScreen() {
	const mutedColor = useThemeColor("muted");
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
	const rows =
		scope === "friends"
			? (friends.data?.entries ?? [])
			: [...(global.data?.entries ?? []), ...(more.data?.entries ?? [])];
	const loading =
		scope === "friends" ? friends.isLoading : global.isLoading && offset === 0;

	let content: React.ReactNode;
	if (loading) {
		content = (
			<View className="items-center py-12">
				<Spinner size="lg" />
			</View>
		);
	} else if (rows.length === 0) {
		content = (
			<Surface className="items-center rounded-lg py-10" variant="secondary">
				<Ionicons color={mutedColor} name="podium-outline" size={40} />
				<Text className="mt-3 font-medium text-foreground">
					No rankings yet
				</Text>
				<Text className="mt-1 text-muted text-xs">
					Ring some friends to start climbing
				</Text>
			</Surface>
		);
	} else {
		content = (
			<Surface className="rounded-lg p-1" variant="secondary">
				{rows.map((entry) => (
					<View
						className={`flex-row items-center justify-between px-3 py-3 ${entry.id === me?.id ? "rounded-lg bg-primary/10" : ""}`}
						key={entry.id}
					>
						<View className="flex-row items-center gap-3">
							<View
								className={`h-7 w-7 items-center justify-center rounded-full ${entry.rank <= 3 ? "bg-primary" : "bg-muted"}`}
							>
								<Text className="font-semibold text-foreground text-xs">
									{entry.rank}
								</Text>
							</View>
							<Text className="font-medium text-foreground text-sm">
								{entry.name}
								{entry.id === me?.id ? " (you)" : ""}
							</Text>
						</View>
						<Text className="font-semibold text-foreground text-sm">
							{entry.points.toLocaleString()}
						</Text>
					</View>
				))}
			</Surface>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 py-2">
					<Text className="font-semibold text-2xl text-foreground tracking-tight">
						Leaderboard
					</Text>
					<Text className="mt-1 text-muted text-sm">
						{me
							? `You're #${me.rank ?? "?"} among friends, #${me.globalRank} globally.`
							: "Climb the ranks."}
					</Text>
				</View>

				<View className="mb-4 flex-row gap-2">
					<ScopeButton
						active={scope === "friends"}
						label="Friends"
						onPress={() => setScope("friends")}
					/>
					<ScopeButton
						active={scope === "global"}
						label="Global"
						onPress={() => setScope("global")}
					/>
				</View>

				{content}

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

function ScopeButton({
	active,
	label,
	onPress,
}: {
	active: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<Button
			onPress={onPress}
			size="sm"
			variant={active ? "primary" : "secondary"}
		>
			<Button.Label>{label}</Button.Label>
		</Button>
	);
}
