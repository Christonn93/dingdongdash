import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Spinner, Surface, useThemeColor } from "heroui-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { trpc } from "@/utils/trpc";

export default function RingScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [now, setNow] = useState(Date.now());
	const [result, setResult] = useState<"caught" | "ditched" | null>(null);

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 250);
		return () => clearInterval(timer);
	}, []);

	const active = useQuery(trpc.rings.getActive.queryOptions());
	const ring = active.data?.rings.find((item) => item.id === id);

	const answer = useMutation(
		trpc.rings.answer.mutationOptions({
			onSuccess: (data) => {
				setResult(data.outcome);
				active.refetch();
			},
		})
	);

	const handleClose = () => router.back();

	if (!(ring || result)) {
		return <RingEndedView loading={active.isLoading} onClose={handleClose} />;
	}

	const remainingMs = ring ? new Date(ring.expiresAt).getTime() - now : 0;
	const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));

	const handleAnswer = () => {
		if (id) {
			answer.mutate({ ringId: id });
		}
	};

	return result ? (
		<RingResultView onClose={handleClose} result={result} />
	) : (
		<IncomingRingView
			isPending={answer.isPending}
			name={ring?.ringer.name ?? "Someone"}
			onAnswer={handleAnswer}
			onClose={handleClose}
			secondsLeft={secondsLeft}
		/>
	);
}

function RingResultView({
	result,
	onClose,
}: {
	result: "caught" | "ditched";
	onClose: () => void;
}) {
	const foregroundColor = useThemeColor("foreground");
	const caught = result === "caught";
	return (
		<Container isScrollable={false}>
			<View className="flex-1 items-center justify-center bg-background p-6">
				<Surface
					className="w-full max-w-sm rounded-2xl p-6"
					variant="secondary"
				>
					<View className="items-center">
						<View
							className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${caught ? "bg-success" : "bg-danger"}`}
						>
							<Ionicons
								color={foregroundColor}
								name={caught ? "checkmark" : "close"}
								size={32}
							/>
						</View>
						<Text className="mb-1 font-bold text-2xl text-foreground">
							{caught ? "Caught!" : "Ditched"}
						</Text>
						<Text className="mb-6 text-center text-muted text-sm">
							{caught
								? "You opened the door in time. +10 points."
								: "The timer ran out. −10 points."}
						</Text>
						<Button className="w-full" onPress={onClose} size="sm">
							<Button.Label>Done</Button.Label>
						</Button>
					</View>
				</Surface>
			</View>
		</Container>
	);
}

function IncomingRingView({
	name,
	secondsLeft,
	isPending,
	onAnswer,
	onClose,
}: {
	name: string;
	secondsLeft: number;
	isPending: boolean;
	onAnswer: () => void;
	onClose: () => void;
}) {
	const foregroundColor = useThemeColor("foreground");
	const mutedColor = useThemeColor("muted");
	const expired = secondsLeft === 0;

	return (
		<Container isScrollable={false}>
			<View className="flex-1 items-center justify-center bg-background p-6">
				<View className="mb-8 items-center">
					<View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-primary">
						<Ionicons color={foregroundColor} name="notifications" size={48} />
					</View>
					<Text className="mb-2 font-bold text-3xl text-foreground">
						{name} is at your door
					</Text>
					<Text className="text-center text-muted">
						Open the door before the timer runs out.
					</Text>
				</View>

				<View className="mb-8 items-center">
					<Text
						className={`font-bold text-6xl ${expired ? "text-danger" : "text-foreground"}`}
					>
						{secondsLeft}
					</Text>
					<Text className="mt-1 text-muted text-xs">seconds</Text>
				</View>

				<Button
					className="w-full max-w-sm"
					isDisabled={isPending || expired}
					onPress={onAnswer}
					size="lg"
				>
					{isPending ? (
						<Spinner color="default" size="sm" />
					) : (
						<>
							<Ionicons
								color={foregroundColor}
								name="enter-outline"
								size={20}
							/>
							<Button.Label>
								{expired ? "Too late" : "Open the door"}
							</Button.Label>
						</>
					)}
				</Button>

				<Button className="mt-3" onPress={onClose} size="sm" variant="ghost">
					<Button.Label>Ignore</Button.Label>
				</Button>

				<Ionicons
					className="mt-8"
					color={mutedColor}
					name="time-outline"
					size={20}
				/>
				<Text className="mt-2 text-center text-muted text-xs">
					The timer is authoritative on the server — it keeps running even if
					you close the app.
				</Text>
			</View>
		</Container>
	);
}

function RingEndedView({
	loading,
	onClose,
}: {
	loading: boolean;
	onClose: () => void;
}) {
	return (
		<Container>
			<View className="flex-1 items-center justify-center p-6">
				<Spinner size="lg" />
				<Text className="mt-4 text-muted text-sm">
					{loading ? "Checking the door..." : "This ring has ended."}
				</Text>
				<Button className="mt-6" onPress={onClose} variant="secondary">
					<Button.Label>Close</Button.Label>
				</Button>
			</View>
		</Container>
	);
}
