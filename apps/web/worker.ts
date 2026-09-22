/**
 * Web worker entry: proxies API traffic to the server worker so the web app
 * talks to a same-origin `/api` + `/trpc`. This keeps auth cookies
 * first-party (works in Firefox/Safari) and removes CORS for the web app.
 *
 * The `runWorkerFirst: ["/api/*", "/trpc/*"]` asset routing means this fetch
 * handler is only invoked for API paths; everything else serves static assets.
 */
interface WorkerEnv {
	SERVER: { fetch: (input: Request) => Promise<Response> };
}

export default {
	fetch(request: Request, env: WorkerEnv): Promise<Response> {
		return env.SERVER.fetch(request);
	},
};
