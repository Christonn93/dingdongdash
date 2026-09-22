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
import { createAuth } from "./services";

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

app.use(
	"/trpc/*",
	trpcServer({
		createContext: (_opts, context) => createContext({ context }),
		router: appRouter,
	})
);

app.get("/", (c) => c.text("OK"));

export default app;
