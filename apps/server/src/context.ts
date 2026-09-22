import type { Context as ApiContext } from "@dingdongdash/api/context";
import { persistRegion } from "@dingdongdash/api/lib/region";
import type { Context as HonoContext } from "hono";

import { ENV } from "./env.server";
import { createAuth, getDb } from "./services";

export interface CreateContextOptions {
	context: HonoContext;
}

interface DetectedRegion {
	areaCity: string | null;
	areaCountry: string | null;
}

function detectRegion(context: HonoContext): DetectedRegion {
	const cf = context.req.raw.cf as
		| { city?: string; country?: string }
		| undefined;
	return {
		areaCity: cf?.city ?? context.req.header("CF-IPCity") ?? null,
		areaCountry: cf?.country ?? context.req.header("CF-IPCountry") ?? null,
	};
}

export async function createContext({
	context,
}: CreateContextOptions): Promise<ApiContext> {
	const db = await getDb();
	const session = await (await createAuth(db)).api.getSession({
		headers: context.req.raw.headers,
	});
	const region = detectRegion(context);

	// Store the detected region once it differs from what we already know.
	// Region is stable, so this is a rare write (e.g. the user travelled).
	if (
		session &&
		(session.user.areaCity !== region.areaCity ||
			session.user.areaCountry !== region.areaCountry)
	) {
		await persistRegion(db, session.user.id, region);
	}

	return {
		areaCity: region.areaCity,
		areaCountry: region.areaCountry,
		db,
		emailFrom: ENV.EMAIL_FROM,
		expoAccessToken: ENV.EXPO_ACCESS_TOKEN,
		polarAccessToken: ENV.POLAR_ACCESS_TOKEN,
		polarProductIds: ENV.POLAR_PRODUCT_IDS,
		polarSandboxAccessToken: ENV.POLAR_SANDBOX_ACCESS_TOKEN,
		polarSandboxProductIds: ENV.POLAR_SANDBOX_PRODUCT_IDS,
		polarSandboxWebhookSecret: ENV.POLAR_SANDBOX_WEBHOOK_SECRET,
		polarWebhookSecret: ENV.POLAR_WEBHOOK_SECRET,
		publicWebUrl: ENV.PUBLIC_WEB_URL,
		resendApiKey: ENV.RESEND_API_KEY,
		session,
		stripePriceIds: ENV.STRIPE_PRICE_IDS,
		stripeSecretKey: ENV.STRIPE_SECRET_KEY,
		stripeWebhookSecret: ENV.STRIPE_WEBHOOK_SECRET,
		vonageApiKey: ENV.VONAGE_API_KEY,
		vonageApiSecret: ENV.VONAGE_API_SECRET,
		vonageFromNumber: ENV.VONAGE_FROM_NUMBER,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
