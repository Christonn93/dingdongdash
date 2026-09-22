import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import { useCallback } from "react";
import { Pressable, Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

function DrawerLayout() {
	const themeColorForeground = useThemeColor("foreground");
	const themeColorBackground = useThemeColor("background");

	const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

	return (
		<Drawer
			screenOptions={{
				drawerStyle: { backgroundColor: themeColorBackground },
				headerRight: renderThemeToggle,
				headerStyle: { backgroundColor: themeColorBackground },
				headerTintColor: themeColorForeground,
				headerTitleStyle: {
					color: themeColorForeground,
					fontWeight: "600",
				},
			}}
		>
			<Drawer.Screen
				name="dashboard"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="home-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Home
						</Text>
					),
					headerTitle: "DingDongDitch",
				}}
			/>
			<Drawer.Screen
				name="friends"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="people-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Friends
						</Text>
					),
					headerRight: () => (
						<Link asChild href="/modal">
							<Pressable className="mr-4">
								<Ionicons
									color={themeColorForeground}
									name="add-outline"
									size={24}
								/>
							</Pressable>
						</Link>
					),
					headerTitle: "Friends",
				}}
			/>
			<Drawer.Screen
				name="rings"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="notifications-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Rings
						</Text>
					),
					headerTitle: "Rings",
				}}
			/>
			<Drawer.Screen
				name="profile"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<MaterialIcons
							color={focused ? color : themeColorForeground}
							name="person-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Profile
						</Text>
					),
					headerTitle: "Profile",
				}}
			/>
			<Drawer.Screen
				name="settings"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="settings-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Settings
						</Text>
					),
					headerTitle: "Settings",
				}}
			/>
			<Drawer.Screen
				name="leaderboard"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="podium-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Leaderboard
						</Text>
					),
					headerTitle: "Leaderboard",
				}}
			/>
			<Drawer.Screen
				name="shop"
				options={{
					drawerIcon: ({ size, color, focused }) => (
						<Ionicons
							color={focused ? color : themeColorForeground}
							name="cart-outline"
							size={size}
						/>
					),
					drawerLabel: ({ color, focused }) => (
						<Text style={{ color: focused ? color : themeColorForeground }}>
							Shop
						</Text>
					),
					headerTitle: "Shop",
				}}
			/>
		</Drawer>
	);
}

export default DrawerLayout;
