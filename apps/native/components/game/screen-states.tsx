import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { DoorbellButton } from "@/components/door/doorbell-button";

/** Friendly full-area error state with a retry button. */
export function ErrorState({
	message = "Something went wrong while loading this.",
	onRetry,
}: {
	message?: string;
	onRetry?: () => void;
}) {
	const muted = useThemeColor("muted");
	const danger = useThemeColor("danger");

	return (
		<View className="items-center justify-center px-6 py-12">
			<View
				style={{
					alignItems: "center",
					backgroundColor: `${danger}1f`,
					borderRadius: 40,
					height: 64,
					justifyContent: "center",
					marginBottom: 12,
					width: 64,
				}}
			>
				<Ionicons color={danger} name="alert-circle" size={32} />
			</View>
			<Text className="text-center font-semibold text-foreground">
				Oops — the doorbell is offline
			</Text>
			<Text className="mt-1 text-center text-sm" style={{ color: muted }}>
				{message}
			</Text>
			{onRetry ? (
				<View className="mt-4">
					<DoorbellButton
						icon="arrow"
						label="Try again"
						onPress={onRetry}
						size="sm"
						variant="secondary"
					/>
				</View>
			) : null}
		</View>
	);
}
