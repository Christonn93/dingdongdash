import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";

import { DoorbellButton } from "@/components/door/doorbell-button";

/**
 * DailyBonusCard — a golden "come back tomorrow" card with a claim button.
 * Shows only while a bonus is available for the current UTC day.
 */

interface DailyBonusCardProps {
	claiming: boolean;
	onClaim: () => void;
	onDismiss: () => void;
	points: number;
}

export function DailyBonusCard({
	claiming,
	onClaim,
	onDismiss,
	points,
}: DailyBonusCardProps) {
	return (
		<Animated.View
			entering={FadeInDown.springify().damping(16)}
			exiting={FadeOut.duration(200)}
		>
			<View
				style={{
					backgroundColor: "#f5b301",
					borderColor: "#fde68a",
					borderRadius: 24,
					borderWidth: 1,
					boxShadow: "0 10px 30px rgba(245,179,1,0.4)",
					marginBottom: 16,
					padding: 16,
				}}
			>
				<View className="flex-row items-center gap-3">
					<View
						style={{
							alignItems: "center",
							backgroundColor: "rgba(255,255,255,0.35)",
							borderRadius: 18,
							height: 44,
							justifyContent: "center",
							width: 44,
						}}
					>
						<Text style={{ fontSize: 22 }}>🎁</Text>
					</View>
					<View className="flex-1">
						<Text className="font-black text-lg" style={{ color: "#5c4303" }}>
							Daily bonus ready!
						</Text>
						<Text
							className="font-semibold text-xs"
							style={{ color: "#7a5a08" }}
						>
							Step inside for +{points} points. New one every day.
						</Text>
					</View>
					<Pressable
						accessibilityLabel="Dismiss"
						hitSlop={10}
						onPress={onDismiss}
					>
						<Ionicons color="#7a5a08" name="close" size={20} />
					</Pressable>
				</View>
				<View className="mt-3">
					<DoorbellButton
						icon="gift"
						label={`Claim +${points}`}
						loading={claiming}
						onPress={onClaim}
						size="md"
					/>
				</View>
			</View>
		</Animated.View>
	);
}