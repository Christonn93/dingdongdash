import { lookupProduct } from "@dingdongdash/api/lib/catalog";
import { verifyPolarSignature } from "@dingdongdash/api/lib/polar";
import { grantPurchase } from "@dingdongdash/api/lib/purchase-grant";
import { appRouter } from "@dingdongdash/api/routers/index";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";
import {
	desktopOrigins,
	ENV,
	liveOrigins,
	nativeDevOrigins,
} from "./env.server";
import { createAuth, getDb } from "./services";

function parseOriginList(value: string): string[] {
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		credentials: true,
		origin: [
			...parseOriginList(ENV.CORS_ORIGIN),
			...desktopOrigins,
			...liveOrigins,
			...nativeDevOrigins,
		],
	})
);

app.on(["POST", "GET"], "/api/auth/*", async (c) =>
	(await createAuth()).handler(c.req.raw)
);

app.post("/api/webhooks/polar", async (c) => {
	const secret = ENV.POLAR_WEBHOOK_SECRET;
	if (!secret) {
		return c.json({ error: "Polar webhooks are not configured" }, 503);
	}
	const rawBody = await c.req.text();
	const signature = c.req.header("polar-signature") ?? "";
	if (!verifyPolarSignature(rawBody, signature, secret)) {
		return c.json({ error: "Invalid signature" }, 400);
	}

	let payload: {
		data?: {
			id?: string;
			metadata?: Record<string, string>;
			status?: string;
		};
		type?: string;
	};
	try {
		payload = JSON.parse(rawBody) as typeof payload;
	} catch {
		return c.json({ error: "Invalid payload" }, 400);
	}

	if (payload.type === "checkout.updated" && payload.data?.status === "paid") {
		const { productId, userId } = payload.data.metadata ?? {};
		const product = productId ? lookupProduct(productId) : undefined;
		if (product && userId && productId) {
			const db = await getDb();
			await grantPurchase(
				db,
				userId,
				{
					platform: "web",
					platformTransactionId: payload.data.id ?? `polar-${Date.now()}`,
					productId,
				},
				product
			);
		}
	}

	return c.json({ received: true });
});

app.use(
	"/trpc/*",
	trpcServer({
		createContext: (_opts, context) => createContext({ context }),
		router: appRouter,
	})
);

app.get("/", (c) => c.text("OK"));

export default app;
