import { Link, Stack } from "expo-router";
import { Button, Surface, useThemeColor } from "heroui-native";
import { Text, View } from "react-native";

import { Container } from "@/components/container";

export default function NotFoundScreen() {
	const accent = useThemeColor("accent");
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");

	return (
		<>
			<Stack.Screen options={{ title: "Not Found" }} />
			<Container>
				<View className="flex-1 items-center justify-center p-4">
					<Surface
						className="max-w-sm items-center rounded-3xl p-6"
						variant="secondary"
					>
						<View
							style={{
								alignItems: "center",
								backgroundColor: `${accent}22`,
								borderRadius: 999,
								height: 72,
								justifyContent: "center",
								marginBottom: 14,
								width: 72,
							}}
						>
							<Text style={{ fontSize: 34 }}>🚪</Text>
						</View>
						<Text
							className="mb-1 text-center font-black text-xl"
							style={{ color: foreground }}
						>
							Wrong doorstep
						</Text>
						<Text className="mb-4 text-center text-sm" style={{ color: muted }}>
							There's no door behind this link. Head back to your own doorstep.
						</Text>
						<Link asChild href="/">
							<Button size="sm">Go home</Button>
						</Link>
					</Surface>
				</View>
			</Container>
		</>
	);
}
