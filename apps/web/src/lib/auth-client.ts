import { createAuthClient } from "better-auth/react";

import { ENV } from "../env.public";

export const authClient = createAuthClient({
	baseURL: ENV.VITE_SERVER_URL,
});

/**
 * Typed email sign-up that also accepts the server's `username` additional
 * field. The auth client's inferred input type doesn't know about it, so the
 * single cast lives here instead of at every call site.
 */
export function signUpEmail(
	input: {
		callbackURL: string;
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
