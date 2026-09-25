import Constants from "expo-constants";
import {
	AndroidImportance,
	addNotificationResponseReceivedListener,
	getExpoPushTokenAsync,
	getPermissionsAsync,
	type NotificationResponse,
	requestPermissionsAsync,
	setNotificationChannelAsync,
	setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";

import { trpcClient } from "@/utils/trpc";

const RING_CHANNEL_ID = "rings";

/** True when running inside Expo Go, where remote push is unavailable since
 * SDK 53 and expo-notifications throws. Push only works in a dev build. */
function isExpoGo(): boolean {
	return (
		Constants.executionEnvironment ===
		Constants.ExecutionEnvironment.StoreClient
	);
}

export interface RingNotificationData {
	ringId?: string;
	type?: string;
}

/** Configure the foreground handler and (on Android) the high-priority ring
 * channel. Run once at app start. Safely no-ops in Expo Go. */
export function configureNotificationHandler(): void {
	if (isExpoGo()) {
		return;
	}
	try {
		setNotificationHandler({
			handleNotification: async () => ({
				shouldPlaySound: true,
				shouldSetBadge: false,
				shouldShowBanner: true,
				shouldShowList: true,
			}),
		});

		if (Platform.OS === "android") {
			setNotificationChannelAsync(RING_CHANNEL_ID, {
				enableVibrate: true,
				importance: AndroidImportance.MAX,
				name: "Incoming rings",
				sound: "default",
			});
		}
	} catch {
		// Push unavailable on this client — the app must still run.
	}
}

/** Request permission, fetch the Expo push token, and register it with the
 * server. Returns null when permission is denied, running in Expo Go, or no
 * EAS project is configured yet. */
export async function registerForPushNotifications(): Promise<string | null> {
	if (isExpoGo()) {
		return null;
	}
	try {
		const { status: currentStatus } = await getPermissionsAsync();
		let status = currentStatus;
		if (status !== "granted") {
			const { status: requestedStatus } = await requestPermissionsAsync();
			status = requestedStatus;
		}
		if (status !== "granted") {
			return null;
		}

		const projectId = Constants.expoConfig?.extra?.eas?.projectId;
		if (!projectId) {
			return null;
		}

		const { data: token } = await getExpoPushTokenAsync({ projectId });
		await trpcClient.users.registerDeviceToken.mutate({
			platform: Platform.OS === "ios" ? "ios" : "android",
			token,
		});
		return token;
	} catch {
		return null;
	}
}

/** Subscribe to taps on notifications. Returns an unsubscribe function.
 * Safely returns a no-op in Expo Go. */
export function listenForRingNotifications(
	onRing: (ringId: string) => void
): () => void {
	if (isExpoGo()) {
		return () => undefined;
	}
	try {
		const subscription = addNotificationResponseReceivedListener(
			(response: NotificationResponse) => {
				const data = response.notification.request.content
					.data as RingNotificationData;
				if (data.type === "ring" && data.ringId) {
					onRing(data.ringId);
				}
			}
		);
		return () => subscription.remove();
	} catch {
		return () => undefined;
	}
}
