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
		session,
		publicWebUrl: ENV.PUBLIC_WEB_URL,
		expoAccessToken: ENV.EXPO_ACCESS_TOKEN,
		resendApiKey: ENV.RESEND_API_KEY,
		emailFrom: ENV.EMAIL_FROM,
		vonageApiKey: ENV.VONAGE_API_KEY,
		vonageApiSecret: ENV.VONAGE_API_SECRET,
		vonageFromNumber: ENV.VONAGE_FROM_NUMBER,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
