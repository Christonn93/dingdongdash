import { appRouter } from "@dingdongdash/api/routers/index";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";
import { desktopOrigins, ENV } from "./env.server";
import { createAuth } from "./services";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		credentials: true,
		origin: [ENV.CORS_ORIGIN, ...desktopOrigins],
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
