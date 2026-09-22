import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Button, Chip, Spinner, Surface, useThemeColor } from "heroui-native";
import { ScrollView, Text, View } from "react-native";

import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

export default function RingsScreen() {
	const mutedColor = useThemeColor("muted");
	const foregroundColor = useThemeColor("foreground");

	const active = useQuery(
		trpc.rings.getActive.queryOptions(undefined, { refetchInterval: 3000 })
	);
	const history = useQuery(
		trpc.rings.getHistory.queryOptions({ cursor: undefined, limit: 20 })
	);

	const activeRings = active.data?.rings ?? [];
	const entries = history.data?.entries ?? [];

	let historyContent: React.ReactNode;
	if (history.isLoading) {
		historyContent = (
			<View className="items-center py-10">
				<Spinner size="lg" />
			</View>
		);
	} else if (entries.length === 0) {
		historyContent = (
			<Surface className="items-center rounded-lg py-10" variant="secondary">
				<Ionicons color={mutedColor} name="time-outline" size={40} />
				<Text className="mt-3 font-medium text-foreground">No rings yet</Text>
				<Text className="mt-1 text-muted text-xs">
					Ring a friend from the Friends tab to get started
				</Text>
			</Surface>
		);
	} else {
		historyContent = (
			<View className="gap-2">
				{entries.map((entry) => (
					<Surface
						className="rounded-lg p-3"
						key={entry.id}
						variant="secondary"
					>
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<Text className="font-medium text-foreground text-sm capitalize">
									{entry.status}
								</Text>
								<Text className="text-muted text-xs">
									{new Date(entry.createdAt).toLocaleString()}
								</Text>
							</View>
							<Chip
								color={ringChipColor(entry.status)}
								size="sm"
								variant="secondary"
							>
								<Chip.Label>{entry.status}</Chip.Label>
							</Chip>
						</View>
					</Surface>
				))}
			</View>
		);
	}

	return (
		<Container>
			<ScrollView className="flex-1" contentContainerClassName="p-4">
				<View className="mb-4 py-2">
					<Text className="font-semibold text-2xl text-foreground tracking-tight">
						Rings
					</Text>
					<Text className="mt-1 text-muted text-sm">
						Your incoming rings and ring history.
					</Text>
				</View>

				{activeRings.length > 0 ? (
					<View className="mb-6">
						<Text className="mb-2 font-medium text-foreground">
							Incoming now
						</Text>
						<View className="gap-2">
							{activeRings.map((ring) => (
								<Surface
									className="rounded-lg border border-primary/40 p-3"
									key={ring.id}
									variant="secondary"
								>
									<View className="flex-row items-center gap-3">
										<Ionicons
											color={foregroundColor}
											name="notifications"
											size={28}
										/>
										<View className="flex-1">
											<Text className="font-medium text-foreground text-sm">
												{ring.ringer.name} is at your door
											</Text>
											<Text className="text-muted text-xs">
												Answer before the timer runs out
											</Text>
										</View>
										<Link asChild href={`/ring/${ring.id}`}>
											<Button size="sm">
												<Button.Label>Open</Button.Label>
											</Button>
										</Link>
									</View>
								</Surface>
							))}
						</View>
					</View>
				) : null}

				<Text className="mb-2 font-medium text-foreground">History</Text>
				{historyContent}
			</ScrollView>
		</Container>
	);
}

function ringChipColor(
	status: "caught" | "ditched" | "pending"
): "success" | "danger" | "accent" {
	if (status === "caught") {
		return "success";
	}
	if (status === "ditched") {
		return "danger";
	}
	return "accent";
}
