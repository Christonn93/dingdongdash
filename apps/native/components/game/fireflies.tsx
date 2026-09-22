import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

/**
 * Fireflies — soft, drifting embers that float over the doorstep at night.
 * Pure ambiance; adds life to an otherwise static scene.
 */

const FIREFLY_COUNT = 8;
const COLORS = ["#ffd28a", "#ffb14e", "#ffe9b3", "#fff3d6"];

interface FireflyConfig {
	color: string;
	delay: number;
	drift: number;
	duration: number;
	id: number;
	size: number;
	sway: number;
	x: number; // 0..1 fraction of parent width
	y: number; // 0..1 fraction of parent height
}

function randomBetween(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

function makeFirefly(index: number): FireflyConfig {
	return {
		color: COLORS[index % COLORS.length],
		delay: randomBetween(0, 1600),
		drift: randomBetween(6, 18),
		duration: randomBetween(1800, 3600),
		id: index,
		size: randomBetween(2, 4),
		sway: randomBetween(4, 14),
		x: randomBetween(0.05, 0.95),
		y: randomBetween(0.04, 0.5),
	};
}

function Firefly({ fly }: { fly: FireflyConfig }) {
	const drift = useSharedValue(0);
	const sway = useSharedValue(0);
	const flicker = useSharedValue(1);

	useEffect(() => {
		drift.value = withRepeat(
			withTiming(fly.drift, {
				duration: fly.duration,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);
		sway.value = withRepeat(
			withTiming(fly.sway, {
				duration: fly.duration * 0.8,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);
		flicker.value = withRepeat(
			withTiming(0.25, {
				duration: fly.duration * 0.6,
				easing: Easing.inOut(Easing.sin),
			}),
			-1,
			true
		);
	}, [drift, flicker, fly, sway]);

	const style = useAnimatedStyle(() => ({
		opacity: flicker.value,
		transform: [
			{ translateY: drift.value },
			{ translateX: sway.value },
			{ scale: 1 - 0.25 * flicker.value },
		],
	}));

	return (
		<Animated.View
			style={[
				{
					backgroundColor: fly.color,
					borderRadius: fly.size / 2,
					height: fly.size,
					left: `${fly.x * 100}%`,
					position: "absolute",
					top: `${fly.y * 100}%`,
					width: fly.size,
				},
				style,
			]}
		/>
	);
}

export function Fireflies() {
	const reducedMotion = useReducedMotion();
	const flies = useMemo(
		() => Array.from({ length: FIREFLY_COUNT }, (_, i) => makeFirefly(i)),
		[]
	);

	if (reducedMotion) {
		return null;
	}

	return (
		<View
			style={{
				inset: 0,
				overflow: "hidden",
				pointerEvents: "none",
				position: "absolute",
			}}
		>
			{flies.map((fly) => (
				<Firefly fly={fly} key={fly.id} />
			))}
		</View>
	);
}
