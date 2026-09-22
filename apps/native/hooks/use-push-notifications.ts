import { router } from "expo-router";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import {
	configureNotificationHandler,
	listenForRingNotifications,
	registerForPushNotifications,
} from "@/lib/notifications";

export function usePushNotifications() {
	const { data: session } = authClient.useSession();
	const authed = !!session?.user;

	useEffect(() => {
		configureNotificationHandler();
		const unsubscribe = listenForRingNotifications((ringId) => {
			router.push({ params: { id: ringId }, pathname: "/ring/[id]" });
		});
		return unsubscribe;
	}, []);

	useEffect(() => {
		if (authed) {
			void registerForPushNotifications();
		}
	}, [authed]);
}