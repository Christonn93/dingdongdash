import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { useCallback } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";

import { playSound } from "@/lib/sound";

/**
 * DoorbellButton — a chunky, squishy button that feels physical when you
 * press it: it compresses, lights up, and fires a haptic.
 */

interface DoorbellButtonProps {
	disabled?: boolean;
	icon?:
		| "bell"
		| "bell-ringing"
		| "checkmark"
		| "arrow"
		| "gift"
		| "link"
		| "people";
	label: string;
	loading?: boolean;
	onPress: () => void;
	size?: "sm" | "md" | "lg";
	variant?: "ring" | "secondary" | "ghost";
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const ICON_BY_KIND: Record<
	NonNullable<DoorbellButtonProps["icon"]>,
	IconName
> = {
	arrow: "arrow-forward",
	bell: "notifications-outline",
	"bell-ringing": "notifications",
	checkmark: "checkmark-circle",
	gift: "gift",
	link: "link",
	people: "people",
};

const SIZES = {
	lg: { font: 18, icon: 22, padH: 26, padV: 16 },
	md: { font: 15, icon: 18, padH: 20, padV: 12 },
	sm: { font: 13, icon: 15, padH: 14, padV: 8 },
} as const;

function resolveColors(
	variant: NonNullable<DoorbellButtonProps["variant"]>,
	accent: string,
	surface: string,
	foreground: string,
	muted: string
): { bg: string; text: string } {
	if (variant === "ring") {
		return { bg: accent, text: "#fff" };
	}
	if (variant === "secondary") {
		return { bg: surface, text: foreground };
	}
	return { bg: "transparent", text: muted };
}

export function DoorbellButton({
	label,
	onPress,
	disabled = false,
	loading = false,
	variant = "ring",
	icon = "bell",
	size = "md",
}: DoorbellButtonProps) {
	const pressed = useSharedValue(0);
	const accentColor = useThemeColor("accent");
	const foregroundColor = useThemeColor("foreground");
	const mutedColor = useThemeColor("muted");
	const surfaceColor = useThemeColor("surface");

	const meta = SIZES[size];
	const isRing = variant === "ring";
	const { bg: bgColor, text: textColor } = resolveColors(
		variant,
		accentColor,
		surfaceColor,
		foregroundColor,
		mutedColor
	);
	const shownLabel = loading ? "Ringing…" : label;

	const pressIn = useCallback(() => {
		pressed.value = withSpring(1, { damping: 12, stiffness: 260 });
		if (!(disabled || loading)) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
				() => undefined
			);
			playSound("blip");
		}
	}, [disabled, loading, pressed]);

	const pressOut = useCallback(() => {
		pressed.value = withSpring(0, { damping: 12, stiffness: 260 });
	}, [pressed]);

	const buttonStyle = useAnimatedStyle(() => ({
		transform: [
			{ scale: 1 - 0.05 * pressed.value },
			{ translateY: 2 * pressed.value },
		],
	}));

	const bellStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${-14 * pressed.value}deg` }],
	}));

	return (
		<Animated.View style={buttonStyle}>
			<Pressable
				accessibilityLabel={label}
				accessibilityRole="button"
				disabled={disabled || loading}
				onPress={onPress}
				onPressIn={pressIn}
				onPressOut={pressOut}
				style={[
					{
						alignItems: "center",
						backgroundColor: bgColor,
						borderColor: mutedColor,
						borderRadius: 999,
						borderWidth: variant === "secondary" ? 1 : 0,
						flexDirection: "row",
						gap: 8,
						justifyContent: "center",
						opacity: disabled ? 0.5 : 1,
						paddingHorizontal: meta.padH,
						paddingVertical: meta.padV,
					},
					isRing
						? {
								boxShadow:
									"0 6px 20px rgba(249,115,22,0.45), 0 2px 6px rgba(0,0,0,0.25)",
							}
						: undefined,
				]}
			>
				<Animated.View style={bellStyle}>
					<Ionicons
						color={textColor}
						name={ICON_BY_KIND[icon]}
						size={meta.icon}
					/>
				</Animated.View>
				<Text
					style={{
						color: textColor,
						fontSize: meta.font,
						fontWeight: "700",
					}}
				>
					{shownLabel}
				</Text>
			</Pressable>
		</Animated.View>
	);
}
