import { Ionicons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { useThemeColor } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";

type AuthView = "sign-in" | "sign-up";

/**
 * Step inside — the front-desk sign-in for DingDongDitch. Switch between
 * signing in and creating an account, then the app lets you in.
 */

export default function LoginScreen() {
	const insets = useSafeAreaInsets();
	const background = useThemeColor("background");
	const accent = useThemeColor("accent");
	const foreground = useThemeColor("foreground");
	const muted = useThemeColor("muted");
	const surface = useThemeColor("surface");

	const [view, setView] = useState<AuthView>("sign-in");

	const { data: session, isPending } = authClient.useSession();
	const authed = !!session?.user;

	// Once a session exists, step straight into the dashboard.
	useEffect(() => {
		if (!isPending && authed) {
			// Typed routes regenerate on `expo start`; cast until then.
			router.replace("/dashboard" as Href);
		}
	}, [authed, isPending]);

	const switchToSignUp = useCallback(() => setView("sign-up"), []);
	const switchToSignIn = useCallback(() => setView("sign-in"), []);
	const goBack = useCallback(() => router.back(), []);

	return (
		<View
			style={{
				backgroundColor: background,
				flex: 1,
				paddingBottom: insets.bottom,
				paddingTop: insets.top + 8,
			}}
		>
			{/* Top bar */}
			<View className="flex-row items-center justify-between px-4">
				<Pressable
					accessibilityLabel="Back"
					hitSlop={12}
					onPress={goBack}
					style={({ pressed }) => ({
						alignItems: "center",
						backgroundColor: "rgba(127,127,127,0.18)",
						borderRadius: 20,
						height: 40,
						justifyContent: "center",
						opacity: pressed ? 0.6 : 1,
						width: 40,
					})}
				>
					<Ionicons color={foreground} name="arrow-back" size={22} />
				</Pressable>
				<View style={{ width: 40 }} />
			</View>

			<ScrollView
				className="flex-1"
				contentContainerClassName="flex-grow p-4"
				contentInsetAdjustmentBehavior="automatic"
				keyboardShouldPersistTaps="handled"
			>
				{/* Welcome header */}
				<Animated.View
					className="items-center py-6"
					entering={FadeInDown.duration(400)}
				>
					<View
						style={{
							alignItems: "center",
							backgroundColor: accent,
							borderRadius: 28,
							height: 56,
							justifyContent: "center",
							marginBottom: 16,
							width: 56,
						}}
					>
						<Ionicons color="#fff" name="home" size={28} />
					</View>
					<Text
						className="text-center font-black text-3xl tracking-tight"
						style={{ color: foreground }}
					>
						Welcome to the doorstep
					</Text>
					<Text className="mt-2 text-center text-sm" style={{ color: muted }}>
						{view === "sign-in"
							? "Sign in to step inside your DingDongDitch."
							: "Create an account and get 1000 points to start ringing."}
					</Text>
				</Animated.View>

				{/* Auth form */}
				<Animated.View
					entering={FadeInDown.delay(120).duration(400)}
					style={{
						backgroundColor: surface,
						borderRadius: 24,
						marginBottom: 8,
						padding: 16,
					}}
				>
					{view === "sign-in" ? (
						<SignIn onSwitchToSignUp={switchToSignUp} />
					) : (
						<SignUp onSwitchToSignIn={switchToSignIn} />
					)}
				</Animated.View>

				<View className="flex-row items-center justify-center gap-1.5 py-4">
					<Ionicons color={muted} name="shield-checkmark-outline" size={13} />
					<Text className="text-xs" style={{ color: muted }}>
						Your data stays private. Friends only ring mutual friends.
					</Text>
				</View>
			</ScrollView>
		</View>
	);
}
