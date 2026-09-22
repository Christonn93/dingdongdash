import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@dingdongdash/db";
import { STARTING_POINTS } from "@dingdongdash/db/game";
import {
	account,
	session,
	user,
	verification,
} from "@dingdongdash/db/schema/auth";
import { pointsLedger } from "@dingdongdash/db/schema/game";
import { betterAuth } from "better-auth";

import { renderBrandedEmail, sendAuthEmail } from "./email";

const authSchema = { account, session, user, verification };

function parseOriginList(value: string): string[] {
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

export interface AuthConfig {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
	EMAIL_FROM: string;
	RESEND_API_KEY: string;
}

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = []
) {
	return betterAuth({
		advanced: {
			cookiePrefix: "ddd",
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "none",
				secure: true,
			},
		},
		baseURL: env.BETTER_AUTH_URL,
		database: drizzleAdapter(database, {
			provider: "sqlite",
			schema: authSchema,
		}),
		databaseHooks: {
			user: {
				create: {
					after: async (createdUser) => {
						await database.insert(pointsLedger).values({
							amount: STARTING_POINTS,
							id: crypto.randomUUID(),
							reason: "signup_bonus",
							userId: createdUser.id,
						});
					},
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ url, user: signingUser }) => {
				await sendAuthEmail(
					env,
					signingUser.email,
					"Reset your DingDongDitch password",
					renderBrandedEmail({
						body: "Click the button below to reset your password. The link expires in one hour.",
						ctaHref: url,
						ctaLabel: "Reset my password",
						title: "Reset your password",
					})
				);
			},
		},
		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignUp: true,
			sendVerificationEmail: async ({ url, user: signingUser }) => {
				await sendAuthEmail(
					env,
					signingUser.email,
					"Verify your DingDongDitch email",
					renderBrandedEmail({
						body: "Almost there! Confirm your email to start ringing doorbells.",
						ctaHref: url,
						ctaLabel: "Verify my email",
						title: "Verify your email",
					})
				);
			},
		},
		plugins: [expo()],
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [
			...parseOriginList(env.CORS_ORIGIN),
			...desktopOrigins,
			"dingdongdash://",
			"exp://",
			"http://localhost:8081",
		],
		user: {
			additionalFields: {
				phoneHash: {
					input: false,
					required: false,
					type: "string",
				},
				points: {
					defaultValue: STARTING_POINTS,
					input: false,
					required: false,
					type: "number",
				},
			},
		},
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
