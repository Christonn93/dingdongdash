import { useThemeColor } from "heroui-native";
import { View } from "react-native";
import Animated, { FadeOutDown, ZoomIn } from "react-native-reanimated";

/**
 * DingDongStamp — a big "DING DONG!" badge that pops onto the doorstep and
 * slides away. Re-mount it (change `triggerKey`) to fire it again.
 */

interface DingDongStampProps {
	/** Change this value to replay the stamp. */
	triggerKey: number;
}

export function DingDongStamp({ triggerKey }: DingDongStampProps) {
	const accent = useThemeColor("accent");

	return (
		<View
			style={{
				alignItems: "center",
				inset: 0,
				justifyContent: "center",
				pointerEvents: "none",
				position: "absolute",
			}}
		>
			<Animated.View
				entering={ZoomIn.springify().damping(10).stiffness(220)}
				exiting={FadeOutDown.duration(450)}
				key={triggerKey}
				style={{
					alignItems: "center",
					backgroundColor: accent,
					borderColor: "rgba(255,255,255,0.7)",
					borderRadius: 999,
					borderWidth: 3,
					paddingHorizontal: 26,
					paddingVertical: 12,
					transform: [{ rotate: "-6deg" }],
				}}
			>
				<Animated.Text
					style={{
						color: "#fff",
						fontSize: 26,
						fontWeight: "900",
						letterSpacing: 1,
					}}
				>
					DING DONG!
				</Animated.Text>
			</Animated.View>
		</View>
	);
}
