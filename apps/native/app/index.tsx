import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { type Href, router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
	FadeIn,
	FadeInUp,
	FadeOut,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DoorScene } from "@/components/door/door";
import { Fireflies } from "@/components/game/fireflies";
import { authClient } from "@/lib/auth-client";
import { playSound } from "@/lib/sound";

/**
 * Game entry — you arrive outside your doorstep. Tap the door (or the
 * doorbell) and it swings open. If you're signed in you step into your
 * dashboard; otherwise you're asked to sign in to step inside.
 */

export default function GameEntry() {
	const insets = useSafeAreaInsets();
	const background = useThemeColor("background");
	const accent = useThemeColor("accent");
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");

	const { data: session, isPending } = authClient.useSession();
	const [phase, setPhase] = useState<"idle" | "open">("idle");
	const [busy, setBusy] = useState(false);
	const [opening, setOpening] = useState(false);
	const authed = !!session?.user;

	// Once the door has opened and the session has resolved, step inside.
	useEffect(() => {
		if (!opening || isPending) {
			return;
		}
		// Typed routes regenerate on `expo start`; cast until then.
		router.replace((authed ? "/dashboard" : "/login") as Href);
	}, [authed, isPending, opening]);

	const handleOpen = useCallback(() => {
		if (busy) {
			return;
		}
		setBusy(true);
		setPhase("open");
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
			() => undefined
		);
		playSound("creak");
		// Soft "ding-dong" as you step inside.
		setTimeout(() => playSound("chime"), 450);
		// Let the door swing open before routing.
		setTimeout(() => setOpening(true), 900);
	}, [busy]);

	return (
		<View
			style={{
				backgroundColor: background,
				flex: 1,
				paddingBottom: insets.bottom,
				paddingTop: insets.top,
			}}
		>
			<View className="flex-1 items-center justify-center px-6">
				{/* Brand */}
				<Animated.View
					className="items-center"
					entering={FadeInUp.duration(600)}
				>
					<Text
						className="text-center font-black text-4xl tracking-tight"
						style={{ color: foreground }}
					>
						DING <Text style={{ color: accent }}>DONG</Text> DITCH
					</Text>
					<Text
						className="mt-2 text-center font-medium text-sm"
						style={{ color: muted }}
					>
						Ring your friends. Catch them — or they ditch you.
					</Text>
				</Animated.View>

				{/* The door */}
				<Animated.View
					className="my-6"
					entering={FadeIn.delay(200).duration(600)}
				>
					<View style={{ position: "relative" }}>
						<DoorScene
							idleAction="open"
							onOpen={handleOpen}
							phase={phase}
							size={320}
						/>
						<Fireflies />
					</View>
				</Animated.View>

				{/* Hint / loading */}
				<View className="h-16 items-center justify-center">
					{phase === "idle" ? (
						<TapHint color={accent} onPress={handleOpen} />
					) : (
						<Animated.View
							className="flex-row items-center gap-2"
							entering={FadeIn.springify().damping(14)}
							exiting={FadeOut.duration(200)}
						>
							<Text className="font-semibold text-sm" style={{ color: muted }}>
								Coming in…
							</Text>
						</Animated.View>
					)}
				</View>
			</View>

			{/* Small print */}
			<View className="items-center pb-4">
				<Text className="text-xs" style={{ color: muted }}>
					Adults 17+ · Mutual friends only · 1 ring per hour
				</Text>
			</View>
		</View>
	);
}

function TapHint({ color, onPress }: { color: string; onPress: () => void }) {
	const reducedMotion = useReducedMotion();
	const pulse = useSharedValue(0);

	useEffect(() => {
		if (reducedMotion) {
			pulse.value = 1;
			return;
		}
		pulse.value = withRepeat(
			withSequence(
				withTiming(1, { duration: 700 }),
				withTiming(0.25, { duration: 700 })
			),
			-1,
			true
		);
		return () => {
			pulse.value = 0;
		};
	}, [pulse, reducedMotion]);

	const pillStyle = useAnimatedStyle(() => ({
		opacity: 0.45 + 0.55 * pulse.value,
		transform: [
			{ translateY: -3 * pulse.value },
			{ scale: 1 + 0.03 * pulse.value },
		],
	}));

	const arrowStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: 4 * pulse.value }],
	}));

	return (
		<Animated.View style={pillStyle}>
			<Pressable
				accessibilityLabel="Open the door to start"
				onPress={onPress}
				style={{
					alignItems: "center",
					backgroundColor: "rgba(127,127,127,0.14)",
					borderColor: color,
					borderRadius: 999,
					borderWidth: 1,
					flexDirection: "row",
					gap: 8,
					paddingHorizontal: 18,
					paddingVertical: 10,
				}}
			>
				<Text
					className="font-bold text-sm uppercase tracking-widest"
					style={{ color }}
				>
					Tap the door to come in
				</Text>
				<Animated.View style={arrowStyle}>
					<Ionicons color={color} name="arrow-forward" size={16} />
				</Animated.View>
			</Pressable>
		</Animated.View>
	);
}
