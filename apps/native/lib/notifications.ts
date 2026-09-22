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

export interface RingNotificationData {
	ringId?: string;
	type?: string;
}

/** Configure the foreground handler and (on Android) the high-priority ring
 * channel. Run once at app start. */
export function configureNotificationHandler(): void {
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
}

/** Request permission, fetch the Expo push token, and register it with the
 * server. Returns null when permission is denied or no EAS project is
 * configured yet. */
export async function registerForPushNotifications(): Promise<string | null> {
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
}

/** Subscribe to taps on notifications. Returns an unsubscribe function. */
export function listenForRingNotifications(
	onRing: (ringId: string) => void
): () => void {
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
}
