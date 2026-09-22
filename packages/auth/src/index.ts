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
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";

import { renderBrandedEmail, sendAuthEmail } from "./email";

const authSchema = { account, session, user, verification };

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

function normalizeUsername(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim().toLowerCase();
	return trimmed.length === 0 ? undefined : trimmed;
}

async function assertUniqueUsername(database: Database, username: string) {
	const [existing] = await database
		.select({ id: user.id })
		.from(user)
		.where(eq(user.username, username))
		.limit(1);
	if (existing) {
		throw new APIError("BAD_REQUEST", {
			code: "USERNAME_TAKEN",
			message: "That username is already taken",
		});
	}
}

async function assertUniqueEmail(database: Database, email: string) {
	const [existing] = await database
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	if (existing) {
		throw new APIError("BAD_REQUEST", {
			code: "EMAIL_TAKEN",
			message: "An account with that email already exists",
		});
	}
}

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
					before: async (userData) => {
						const email = userData.email.toLowerCase();
						const username = normalizeUsername(userData.username);
						if (username) {
							if (!USERNAME_REGEX.test(username)) {
								throw new APIError("BAD_REQUEST", {
									code: "INVALID_USERNAME",
									message:
										"Username must be 3-24 lowercase letters, numbers, or underscores",
								});
							}
							await assertUniqueUsername(database, username);
						}
						await assertUniqueEmail(database, email);
						return {
							data: {
								...userData,
								email,
								...(username === undefined ? {} : { username }),
							},
						};
					},
				},
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			revokeSessionsOnPasswordReset: true,
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
				areaCity: {
					input: false,
					required: false,
					type: "string",
				},
				areaCountry: {
					input: false,
					required: false,
					type: "string",
				},
				avatarId: {
					input: false,
					required: false,
					type: "string",
				},
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
				username: {
					input: true,
					required: false,
					type: "string",
				},
			},
		},
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
