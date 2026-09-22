// Alchemy validates deployment inputs with Varlock; Workers use native env bindings.
import type { PublicCoercedEnvSchema } from "./env";

// In production the web worker proxies /api + /trpc to the server (same-origin),
// so VITE_SERVER_URL is empty/relative. Only dev servers that hit the API
// directly need an absolute URL.
export const ENV = {
	VITE_SERVER_URL: import.meta.env.VITE_SERVER_URL ?? "",
} satisfies Pick<PublicCoercedEnvSchema, "VITE_SERVER_URL">;
