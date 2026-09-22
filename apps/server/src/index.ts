import { getAvatarImage } from "@dingdongdash/api/lib/avatars";
import { lookupProduct } from "@dingdongdash/api/lib/catalog";
import { verifyPolarSignature } from "@dingdongdash/api/lib/polar";
import { grantPurchase } from "@dingdongdash/api/lib/purchase-grant";
import { verifyStripeSignature } from "@dingdongdash/api/lib/stripe";
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
	const rawBody = await c.req.text();
	const signature = c.req.header("polar-signature") ?? "";
	const secrets = [
		ENV.POLAR_WEBHOOK_SECRET,
		ENV.POLAR_SANDBOX_WEBHOOK_SECRET,
	].filter(Boolean);
	if (
		secrets.length === 0 ||
		!secrets.some((s) => verifyPolarSignature(rawBody, signature, s))
	) {
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
		await grantFromMetadata(payload.data.id, payload.data.metadata);
	}

	return c.json({ received: true });
});

app.post("/api/webhooks/stripe", async (c) => {
	const secret = ENV.STRIPE_WEBHOOK_SECRET;
	if (!secret) {
		return c.json({ error: "Stripe webhooks are not configured" }, 503);
	}
	const rawBody = await c.req.text();
	const signature = c.req.header("stripe-signature") ?? "";
	if (!verifyStripeSignature(rawBody, signature, secret)) {
		return c.json({ error: "Invalid signature" }, 400);
	}

	let payload: {
		data?: {
			object?: {
				id?: string;
				metadata?: Record<string, string>;
				payment_status?: string;
			};
		};
		type?: string;
	};
	try {
		payload = JSON.parse(rawBody) as typeof payload;
	} catch {
		return c.json({ error: "Invalid payload" }, 400);
	}

	if (
		payload.type === "checkout.session.completed" &&
		payload.data?.object?.payment_status === "paid"
	) {
		await grantFromMetadata(
			payload.data.object.id,
			payload.data.object.metadata
		);
	}

	return c.json({ received: true });
});

/** Grants a purchase from a paid webhook's transaction id + metadata. */
async function grantFromMetadata(
	transactionId: string | undefined,
	metadata: Record<string, string> | undefined
): Promise<void> {
	const { productId, userId } = metadata ?? {};
	const product = productId ? lookupProduct(productId) : undefined;
	if (!(product && userId && productId)) {
		return;
	}
	const db = await getDb();
	await grantPurchase(
		db,
		userId,
		{
			platform: "web",
			platformTransactionId: transactionId ?? `web-${Date.now()}`,
			productId,
		},
		product
	);
}

app.use(
	"/trpc/*",
	trpcServer({
		createContext: (_opts, context) => createContext({ context }),
		router: appRouter,
	})
);

app.get("/avatars/:id", async (c) => {
	const row = await getAvatarImage(await getDb(), c.req.param("id"));
	if (!row) {
		return c.json({ error: "Avatar not found" }, 404);
	}
	const bytes = Uint8Array.from(atob(row.image), (char) => char.charCodeAt(0));
	return new Response(bytes, {
		headers: {
			"cache-control": "public, max-age=31536000, immutable",
			"content-type": row.mime,
		},
	});
});

app.get("/", (c) => c.text("OK"));

export default app;
