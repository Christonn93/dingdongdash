import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { ENV } from "../src/env";

export const authClient = createAuthClient({
	baseURL: ENV.EXPO_PUBLIC_SERVER_URL,
	plugins: [
		expoClient({
			scheme: Constants.expoConfig?.scheme as string,
			storage: SecureStore,
			storagePrefix: Constants.expoConfig?.scheme as string,
		}),
	],
});

/**
 * Typed email sign-up that also accepts the server's `username` additional
 * field. The auth client's inferred input type doesn't know about it, so the
 * single cast lives here instead of at every call site.
 */
export function signUpEmail(
	input: {
		email: string;
		name: string;
		password: string;
		username: string;
	},
	options?: Parameters<typeof authClient.signUp.email>[1]
) {
	return authClient.signUp.email(
		input as Parameters<typeof authClient.signUp.email>[0],
		options
	);
}
