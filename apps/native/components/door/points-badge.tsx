import { useThemeColor } from "heroui-native";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, {
	FadeInDown,
	FadeOutUp,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withSpring,
	withTiming,
} from "react-native-reanimated";

/**
 * PointsBadge — the dopamine counter. Springs and flashes whenever the
 * balance changes, and floats up a "+10" / "−5" chip for the delta.
 */

interface PointsBadgeProps {
	/** Optional delta to animate when it changes (e.g. +10 on a catch). */
	delta?: number | null;
	deltaKey?: string | number;
	points: number;
	size?: "sm" | "md" | "lg";
}

const SIZES = {
	lg: { delta: 18, gap: 6, label: 16, value: 52 },
	md: { delta: 15, gap: 4, label: 12, value: 32 },
	sm: { delta: 12, gap: 2, label: 10, value: 22 },
} as const;

export function PointsBadge({
	points,
	delta = null,
	deltaKey,
	size = "md",
}: PointsBadgeProps) {
	const s = SIZES[size];
	const bump = useSharedValue(1);
	const flash = useSharedValue(0);
	const previous = useRef(points);

	const successColor = useThemeColor("success");
	const dangerColor = useThemeColor("danger");

	const bumped = points !== previous.current;
	previous.current = points;

	useEffect(() => {
		if (!bumped) {
			return;
		}
		bump.value = withSequence(
			withSpring(1.25, { damping: 9, stiffness: 260 }),
			withSpring(1, { damping: 14, stiffness: 200 })
		);
		flash.value = withSequence(
			withTiming(1, { duration: 150 }),
			withTiming(0, { duration: 650 })
		);
	}, [bumped, bump, flash]);

	const badgeStyle = useAnimatedStyle(() => ({
		transform: [{ scale: bump.value }],
	}));

	const flashStyle = useAnimatedStyle(() => ({
		opacity: flash.value,
	}));

	const isPositive = (delta ?? 0) >= 0;

	return (
		<View style={{ alignItems: "center" }}>
			<Animated.View
				style={[
					{ alignItems: "center", flexDirection: "row", gap: s.gap },
					badgeStyle,
				]}
			>
				<Text
					style={{
						color: "#fff",
						fontSize: s.value,
						fontVariant: ["tabular-nums"],
						fontWeight: "800",
					}}
				>
					{points.toLocaleString()}
				</Text>
				<Text
					style={{
						color: "rgba(255,255,255,0.75)",
						fontSize: s.label,
						fontWeight: "600",
					}}
				>
					pts
				</Text>
			</Animated.View>

			{delta !== null && deltaKey !== undefined ? (
				<Animated.View
					entering={FadeInDown.delay(80).springify().damping(12)}
					exiting={FadeOutUp.duration(350)}
					key={deltaKey}
					style={{ marginTop: 2 }}
				>
					<Animated.View style={flashStyle}>
						<Text
							style={{
								color: isPositive ? successColor : dangerColor,
								fontSize: s.delta,
								fontVariant: ["tabular-nums"],
								fontWeight: "800",
							}}
						>
							{isPositive ? "+" : ""}
							{delta}
						</Text>
					</Animated.View>
				</Animated.View>
			) : null}
		</View>
	);
}
