import { type ReactNode, useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from "react-native-reanimated";

/**
 * ShakeView — gives its children a quick physical shake whenever `shakeKey`
 * changes. Perfect for catches, ditches and ringing the doorbell.
 */

interface ShakeViewProps {
	children: ReactNode;
	/** Peak displacement in px. */
	intensity?: number;
	/** Change this value to trigger a shake. */
	shakeKey: number | string | null;
	style?: StyleProp<ViewStyle>;
}

export function ShakeView({
	children,
	shakeKey,
	intensity = 6,
	style,
}: ShakeViewProps) {
	const tx = useSharedValue(0);
	const ty = useSharedValue(0);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		if (reducedMotion || shakeKey === null) {
			return;
		}
		tx.value = withSequence(
			withTiming(intensity, { duration: 40 }),
			withTiming(-intensity, { duration: 60 }),
			withTiming(intensity * 0.6, { duration: 50 }),
			withTiming(0, { duration: 60 })
		);
		ty.value = withSequence(
			withTiming(-intensity * 0.6, { duration: 50 }),
			withTiming(intensity * 0.4, { duration: 60 }),
			withTiming(0, { duration: 50 })
		);
	}, [intensity, reducedMotion, shakeKey, tx, ty]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: tx.value }, { translateY: ty.value }],
	}));

	return (
		<Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
	);
}
