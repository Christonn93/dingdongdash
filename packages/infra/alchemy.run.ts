import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

export const db = Cloudflare.D1.Database("database", {
	migrations: "../../packages/db/src/migrations",
});

export const server = Cloudflare.Worker("server", {
	compatibility: {
		flags: ["nodejs_compat"],
	},
	dev: {
		port: 3000,
	},
	env: {
		BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
		BETTER_AUTH_URL: Cloudflare.Worker.URL,
		CORS_ORIGIN: Config.String("CORS_ORIGIN"),
		DB: db,
		EMAIL_FROM: Config.String("EMAIL_FROM").pipe(Config.withDefault("")),
		EXPO_ACCESS_TOKEN: Config.String("EXPO_ACCESS_TOKEN").pipe(
			Config.withDefault("")
		),
		POLAR_ACCESS_TOKEN: Config.String("POLAR_ACCESS_TOKEN").pipe(
			Config.withDefault("")
		),
		POLAR_PRODUCT_IDS: Config.String("POLAR_PRODUCT_IDS").pipe(
			Config.withDefault("")
		),
		POLAR_WEBHOOK_SECRET: Config.String("POLAR_WEBHOOK_SECRET").pipe(
			Config.withDefault("")
		),
		PUBLIC_WEB_URL: Config.String("PUBLIC_WEB_URL").pipe(
			Config.withDefault("http://localhost:3001")
		),
		RESEND_API_KEY: Config.String("RESEND_API_KEY").pipe(
			Config.withDefault("")
		),
		VONAGE_API_KEY: Config.String("VONAGE_API_KEY").pipe(
			Config.withDefault("")
		),
		VONAGE_API_SECRET: Config.String("VONAGE_API_SECRET").pipe(
			Config.withDefault("")
		),
		VONAGE_FROM_NUMBER: Config.String("VONAGE_FROM_NUMBER").pipe(
			Config.withDefault("")
		),
	},
	main: "../../apps/server/src/index.ts",
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
	"dingdongdash",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const serverWorker = yield* server;

		// `alchemy dev` runs a Vite module runner that can't host a custom
		// worker entry; in dev the Vite server proxies /api + /trpc to the
		// server directly (see apps/web/vite.config.ts). The same-origin proxy
		// worker is only deployed in production.
		const isDev =
			(process.env.ALCHEMY_STAGE ?? "").startsWith("dev") ||
			process.argv[2] === "dev";

		const webWorker = yield* Cloudflare.Website.Vite("web", {
			assets: {
				htmlHandling: "auto-trailing-slash",
				notFoundHandling: "single-page-application",
				...(isDev ? {} : { runWorkerFirst: ["/api/*", "/trpc/*"] }),
			},
			dev: {
				port: 3001,
			},
			env: isDev
				? { VITE_SERVER_URL: "" }
				: { SERVER: serverWorker, VITE_SERVER_URL: "" },
			...(isDev ? {} : { main: "./worker.ts" }),
			rootDir: "../../apps/web",
		});

		return {
			server: serverWorker.url,
			web: webWorker.url,
		};
	})
);
