/// <reference types="@cloudflare/workers-types" />
/// <reference path="../cloudflare-env.d.ts" />
// For Cloudflare Workers, env is accessed via cloudflare:workers module
// Types are defined in env.d.ts based on your alchemy.run.ts bindings
export { env as ENV } from "cloudflare:workers";

/** Packaged desktop builds serve the frontend from their own origin, not CORS_ORIGIN. */
export const desktopOrigins = ["views://mainview"];

/** Expo dev server (Metro) origin for the native app. */
export const nativeDevOrigins = ["http://localhost:8081"];

/** Live Cloudflare Workers deployment origins that must be allowed to call the API. */
export const liveOrigins = [
	"https://dingdongdash-server-live-chrisdev-cthd35xrvh5c2sw3.christopher-c02.workers.dev",
	"https://dingdongdash-web-live-chrisdev-outm2e3l4kdlgrkg.christopher-c02.workers.dev",
];
