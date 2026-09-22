import type { Context as ApiContext } from "@dingdongdash/api/context";
import type { Context as HonoContext } from "hono";
import { ENV } from "./env.server";
import { createAuth, getDb } from "./services";

export interface CreateContextOptions {
	context: HonoContext;
}

export async function createContext({
	context,
}: CreateContextOptions): Promise<ApiContext> {
	const db = await getDb();
	const session = await (await createAuth(db)).api.getSession({
		headers: context.req.raw.headers,
	});
	return {
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
