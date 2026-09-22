import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Chip, useThemeColor } from "heroui-native";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { queryClient, trpc } from "@/utils/trpc";

type AuthView = "sign-in" | "sign-up";

function statusLabel(isLoading: boolean, isConnected: boolean): string {
	if (isLoading) {
		return "Checking connection...";
	}

	if (isConnected) {
		return "Connected to API";
	}

	return "API Disconnected";
}

export default function Home() {
	const healthCheck = useQuery(trpc.healthCheck.queryOptions());
	const { data: session } = authClient.useSession();
	const authed = !!session?.user;
	const user = session?.user;
	const me = useQuery(
		trpc.users.me.queryOptions(undefined, { enabled: authed })
	);
	const isConnected = healthCheck?.data === "OK";
	const isLoading = healthCheck?.isLoading;

	const mutedColor = useThemeColor("muted");
	const successColor = useThemeColor("success");
	const dangerColor = useThemeColor("danger");

	const points = me.data?.user.points ?? 1000;
	const friendCount = me.data?.friendCount ?? 0;

	const [authView, setAuthView] = useState<AuthView>("sign-in");

	const handleSignOut = useCallback(() => {
		authClient.signOut();
		queryClient.clear();
	}, []);

	// Stable callbacks so SignIn/SignUp don't receive a new function
	// reference on every render (fixes noJsxPropsBind at this call site).
	const switchToSignUp = useCallback(() => {
		setAuthView("sign-up");
	}, []);

	const switchToSignIn = useCallback(() => {
		setAuthView("sign-in");
	}, []);

	return (
		<Container>
			<View className="gap-1 px-4 pt-6">
				<Text className="font-bold text-2xl text-foreground">DING DONG</Text>
				<Text className="text-muted-foreground">
					Ring the doorbell. Beat the clock.
				</Text>
			</View>

			{authed && user ? (
				<Card className="m-4 p-4">
					<Text className="font-semibold text-foreground text-lg">
						Welcome, {user.name}
					</Text>
					<Text className="text-muted-foreground">{user.email}</Text>

					<View className="mt-3 flex-row items-center gap-2">
						<Text className="font-bold text-foreground text-xl">{points}</Text>
						<Text className="text-muted-foreground">points</Text>
					</View>

					<Text className="mt-1 text-muted-foreground">
						{friendCount} friends
					</Text>

					<Chip className="mt-3 self-start">
						<Chip.Label>Ready to ring</Chip.Label>
					</Chip>

					<Pressable className="mt-4" onPress={handleSignOut}>
						<Text className="font-medium text-foreground">Sign Out</Text>
					</Pressable>
				</Card>
			) : (
				<View className="gap-1 px-4 pt-2">
					<Text className="font-semibold text-foreground text-lg">
						Get started
					</Text>
					<Text className="text-muted-foreground">
						Ring a friend. Catch them, or they ditch you.
					</Text>
				</View>
			)}

			<Card className="m-4 p-4">
				<Text className="font-medium text-foreground">System Status</Text>

				<View className="mt-2 flex-row items-center justify-between">
					<Text className="text-muted-foreground">TRPC Backend</Text>
					<Chip>
						<Chip.Label>{isConnected ? "LIVE" : "OFFLINE"}</Chip.Label>
					</Chip>
				</View>

				<View className="mt-2 flex-row items-center gap-2">
					{isLoading ? (
						<Ionicons color={mutedColor} name="time-outline" size={16} />
					) : null}
					{!isLoading && isConnected ? (
						<Ionicons
							color={successColor}
							name="checkmark-circle-outline"
							size={16}
						/>
					) : null}
					{isLoading || isConnected ? null : (
						<Ionicons
							color={dangerColor}
							name="close-circle-outline"
							size={16}
						/>
					)}
					<Text className="text-muted-foreground">
						{statusLabel(!!isLoading, isConnected)}
					</Text>
				</View>
			</Card>

			{authed ? null : (
				<View className="px-4 pb-8">
					{authView === "sign-in" ? (
						<SignIn onSwitchToSignUp={switchToSignUp} />
					) : (
						<SignUp onSwitchToSignIn={switchToSignIn} />
					)}
				</View>
			)}
		</Container>
	);
}
