import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

interface HowToPlayProps {
	accent: string;
	border: string;
	foreground: string;
	muted: string;
	surface: string;
}

const RULES: { emoji: string; text: string }[] = [
	{
		emoji: "🔔",
		text: "Ring a friend — they get 30 seconds to open their door.",
	},
	{
		emoji: "✅",
		text: "They open in time and you're caught: +10 for them, −5 for you.",
	},
	{ emoji: "💨", text: "They're too slow — you ditch them, and they lose 10." },
	{
		emoji: "🛡️",
		text: "Arm a Time Shield to buy 15 extra seconds on your next ring.",
	},
	{
		emoji: "🎁",
		text: "Claim your daily bonus every day to keep your streak alive.",
	},
];

export function HowToPlay({
	accent,
	foreground,
	muted,
	surface,
	border,
}: HowToPlayProps) {
	const [open, setOpen] = useState(false);

	return (
		<Animated.View
			layout={Layout}
			style={{
				backgroundColor: surface,
				borderColor: border,
				borderRadius: 20,
				borderWidth: 1,
				marginTop: 12,
				overflow: "hidden",
			}}
		>
			<Pressable
				accessibilityLabel="How to play"
				onPress={() => setOpen((o) => !o)}
				style={({ pressed }) => ({
					alignItems: "center",
					flexDirection: "row",
					gap: 10,
					opacity: pressed ? 0.7 : 1,
					padding: 14,
				})}
			>
				<Text style={{ fontSize: 20 }}>🎮</Text>
				<Text className="flex-1 font-extrabold" style={{ color: foreground }}>
					How to play
				</Text>
				<Ionicons
					color={muted}
					name={open ? "chevron-up" : "chevron-down"}
					size={18}
				/>
			</Pressable>

			{open ? (
				<Animated.View
					entering={FadeInDown.duration(200)}
					style={{ paddingBottom: 14, paddingHorizontal: 14 }}
				>
					<View className="gap-3">
						{RULES.map((rule) => (
							<View className="flex-row items-start gap-3" key={rule.text}>
								<Text style={{ fontSize: 16 }}>{rule.emoji}</Text>
								<Text
									className="flex-1 text-sm leading-5"
									style={{ color: muted }}
								>
									{rule.text}
								</Text>
							</View>
						))}
					</View>
					<View
						style={{
							alignItems: "center",
							backgroundColor: `${accent}14`,
							borderRadius: 12,
							marginTop: 12,
							padding: 10,
						}}
					>
						<Text className="font-semibold text-xs" style={{ color: accent }}>
							Mutual friends only · 1 ring per hour · DND respected
						</Text>
					</View>
				</Animated.View>
			) : null}
		</Animated.View>
	);
}
