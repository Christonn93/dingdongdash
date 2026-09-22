import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
	FadeInDown,
	FadeInUp,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
	ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfettiBurst } from "@/components/door/confetti";
import { DoorScene } from "@/components/door/door";
import { DoorbellButton } from "@/components/door/doorbell-button";
import { PointsBadge } from "@/components/door/points-badge";
import { ShakeView } from "@/components/game/shake";
import { useCatchStreak } from "@/hooks/use-catch-streak";
import { playSound } from "@/lib/sound";
import { trpc } from "@/utils/trpc";

type RingPhase = "ringing" | "caught" | "ditched" | "checking";

const RING_SECONDS = 30;

function timerColor(secondsLeft: number): string {
	if (secondsLeft > RING_SECONDS * 0.5) {
		return "#4ade80";
	}
	if (secondsLeft > RING_SECONDS * 0.2) {
		return "#fbbf24";
	}
	return "#f87171";
}

interface SceneColors {
	accent: string;
	foreground: string;
	muted: string;
}

export default function RingScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const background = useThemeColor("background");
	const accent = useThemeColor("accent");
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");

	const [now, setNow] = useState(Date.now());
	const [phase, setPhase] = useState<RingPhase>("checking");
	const [name, setName] = useState("Someone");
	const resolveFired = useRef(false);

	const me = useQuery(trpc.users.me.queryOptions());
	const points = me.data?.user.points ?? 1000;

	const active = useQuery(
		trpc.rings.getActive.queryOptions(undefined, { refetchInterval: 2000 })
	);
	const ring = active.data?.rings.find((item) => item.id === id);

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 200);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (ring?.ringer.name) {
			setName(ring.ringer.name);
		}
	}, [ring?.ringer.name]);

	const answer = useMutation(
		trpc.rings.answer.mutationOptions({
			onSuccess: (data) => {
				setPhase(data.outcome === "caught" ? "caught" : "ditched");
				const haptic =
					data.outcome === "caught"
						? Haptics.NotificationFeedbackType.Success
						: Haptics.NotificationFeedbackType.Error;
				Haptics.notificationAsync(haptic).catch(() => undefined);
				if (data.outcome === "caught") {
					playSound("creak");
					setTimeout(() => playSound("fanfare"), 320);
				} else {
					playSound("downer");
				}
				active.refetch();
			},
		})
	);

	const remainingMs = ring ? new Date(ring.expiresAt).getTime() - now : 0;
	const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
	const countdownFraction = ring
		? Math.max(0, Math.min(1, remainingMs / ring.durationMs))
		: 1;
	const shielded = (ring?.durationMs ?? 0) > 30_000;

	useEffect(() => {
		if (phase === "checking" && active.data && ring) {
			setPhase("ringing");
			playSound(shielded ? "shield" : "chime");
		}
	}, [active.data, phase, ring, shielded]);

	const lastTick = useRef(secondsLeft);
	useEffect(() => {
		if (phase !== "ringing" || secondsLeft === lastTick.current) {
			lastTick.current = secondsLeft;
			return;
		}
		lastTick.current = secondsLeft;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
			() => undefined
		);
	}, [phase, secondsLeft]);

	useEffect(() => {
		if (
			phase === "ringing" &&
			secondsLeft === 0 &&
			!resolveFired.current &&
			id
		) {
			resolveFired.current = true;
			answer.mutate({ ringId: id });
		}
	}, [phase, secondsLeft, id, answer]);

	const handleOpenDoor = () => {
		if (!id || answer.isPending) {
			return;
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
			() => undefined
		);
		answer.mutate({ ringId: id });
	};

	const handleClose = () => router.back();

	const colors: SceneColors = { accent, foreground, muted };

	return (
		<View
			style={{
				backgroundColor: background,
				flex: 1,
				paddingTop: insets.top + 8,
			}}
		>
			<TopBar colors={colors} onClose={handleClose} />

			<View className="flex-1 items-center justify-center px-6">
				{phase === "checking" ? <CheckingView colors={colors} /> : null}
				{phase === "ringing" ? (
					<RingingView
						colors={colors}
						countdownFraction={countdownFraction}
						disabled={answer.isPending}
						name={name}
						onOpen={handleOpenDoor}
						secondsLeft={secondsLeft}
						shielded={shielded}
					/>
				) : null}
				{phase === "caught" || phase === "ditched" ? (
					<ResultView
						colors={colors}
						name={name}
						onContinue={handleClose}
						phase={phase}
						points={points}
					/>
				) : null}
			</View>

			<View className="items-center pb-2">
				<Text className="text-xs" style={{ color: muted }}>
					The timer runs server-side — even if you close the app.
				</Text>
			</View>
		</View>
	);
}

function TopBar({
	onClose,
	colors,
}: {
	onClose: () => void;
	colors: SceneColors;
}) {
	return (
		<View className="flex-row items-center justify-between px-4">
			<Pressable
				accessibilityLabel="Close"
				hitSlop={12}
				onPress={onClose}
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
				<Ionicons color={colors.foreground} name="close" size={22} />
			</Pressable>

			<View className="flex-row items-center gap-1.5">
				<Ionicons color={colors.accent} name="notifications" size={16} />
				<Text
					className="font-bold text-sm"
					style={{ color: colors.foreground }}
				>
					Incoming ring
				</Text>
			</View>

			<View style={{ width: 40 }} />
		</View>
	);
}

function CheckingView({ colors }: { colors: SceneColors }) {
	return (
		<View className="items-center">
			<Text className="text-sm" style={{ color: colors.muted }}>
				Checking the door…
			</Text>
		</View>
	);
}

function RingingView({
	colors,
	name,
	secondsLeft,
	countdownFraction,
	disabled,
	shielded,
	onOpen,
}: {
	colors: SceneColors;
	name: string;
	secondsLeft: number;
	countdownFraction: number;
	disabled: boolean;
	shielded: boolean;
	onOpen: () => void;
}) {
	return (
		<Animated.View
			className="w-full items-center"
			entering={FadeInUp.springify().damping(15)}
		>
			{secondsLeft <= 5 ? <HeartbeatOverlay /> : null}

			{shielded ? (
				<View
					style={{
						alignItems: "center",
						alignSelf: "center",
						backgroundColor: "rgba(249,115,22,0.14)",
						borderRadius: 999,
						flexDirection: "row",
						gap: 6,
						marginBottom: 10,
						paddingHorizontal: 12,
						paddingVertical: 5,
					}}
				>
					<Text style={{ fontSize: 14 }}>🛡️</Text>
					<Text
						className="font-bold text-xs"
						style={{ color: colors.foreground }}
					>
						Time Shield ring — extra time!
					</Text>
				</View>
			) : null}

			<View className="mb-2 items-center">
				<Animated.Text
					entering={ZoomIn.duration(120)}
					key={secondsLeft}
					style={{
						color: timerColor(secondsLeft),
						fontSize: 64,
						fontVariant: ["tabular-nums"],
						fontWeight: "900",
					}}
				>
					{secondsLeft}
				</Animated.Text>
				<Text
					className="text-xs uppercase tracking-widest"
					style={{ color: colors.muted }}
				>
					seconds to open
				</Text>
			</View>

			<DoorScene
				countdownFraction={countdownFraction}
				disabled={disabled}
				onOpen={onOpen}
				phase="ringing"
				size={340}
			/>

			<Text
				className="mt-4 text-center font-extrabold text-xl"
				style={{ color: colors.foreground }}
			>
				{name} is at your door!
			</Text>
			<Text
				className="mt-1 mb-4 text-center text-sm"
				style={{ color: colors.muted }}
			>
				Tap the door to open it — or the bell to catch them.
			</Text>
		</Animated.View>
	);
}

function ResultView({
	colors,
	name,
	phase,
	points,
	onContinue,
}: {
	colors: SceneColors;
	name: string;
	phase: "caught" | "ditched";
	points: number;
	onContinue: () => void;
}) {
	const caught = phase === "caught";
	const resultDelta = caught ? 10 : -10;
	const { streak } = useCatchStreak();

	return (
		<Animated.View
			className="w-full items-center"
			entering={FadeInDown.springify().damping(15)}
		>
			<ShakeView intensity={7} shakeKey={phase}>
				<View className="relative">
					<DoorScene
						disabled
						onOpen={onContinue}
						phase={caught ? "open" : "closed"}
						size={340}
					/>
					{caught ? <ConfettiBurst /> : null}
				</View>

				<View className="mt-5 items-center">
					<PointsBadge
						delta={resultDelta}
						deltaKey={phase}
						points={points}
						size="lg"
					/>
					{caught && streak >= 2 ? (
						<View className="mt-2 flex-row items-center gap-1.5">
							<Text style={{ fontSize: 16 }}>🔥</Text>
							<Text
								className="font-extrabold"
								style={{ color: colors.foreground }}
							>
								{streak}x streak — keep it hot!
							</Text>
						</View>
					) : null}
					<Text
						className="mt-2 text-center font-black text-2xl"
						style={{ color: colors.foreground }}
					>
						{caught ? "You caught them!" : "Too slow…"}
					</Text>
					<Text
						className="mt-1 mb-5 text-center text-sm"
						style={{ color: colors.muted }}
					>
						{caught
							? `${name} ditched you — but you beat them to the door. You +10, they −5.`
							: `${name} ditched you. You −10. Ring them back.`}
					</Text>

					<DoorbellButton
						icon={caught ? "checkmark" : "arrow"}
						label={caught ? "Sweet catch" : "Ring them back"}
						onPress={onContinue}
						size="lg"
					/>
				</View>
			</ShakeView>
		</Animated.View>
	);
}

/** Red pulsing vignette that appears when the clock is almost out. */
function HeartbeatOverlay() {
	const reducedMotion = useReducedMotion();
	const pulse = useSharedValue(0);

	useEffect(() => {
		if (reducedMotion) {
			pulse.value = 0.5;
			return;
		}
		pulse.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 260 }),
				withTiming(0.25, { duration: 260 })
			),
			-1,
			false
		);
		return () => {
			pulse.value = 0;
		};
	}, [pulse, reducedMotion]);

	const style = useAnimatedStyle(() => ({
		opacity: 0.18 + 0.2 * pulse.value,
		transform: [{ scale: 1 + 0.02 * pulse.value }],
	}));

	return (
		<Animated.View
			pointerEvents="none"
			style={[
				{
					backgroundColor: "#ef4444",
					borderRadius: 999,
					inset: -40,
					position: "absolute",
				},
				style,
			]}
		/>
	);
}
