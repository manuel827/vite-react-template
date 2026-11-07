import { app } from "../src/worker";

type PagesEnvironment = {
	SUPABASE_URL: string;
	SUPABASE_ANON_KEY: string;
};

type PagesContext = {
	request: Request;
	env: PagesEnvironment;
	next(options?: { request?: Request }): Promise<Response>;
};

export async function onRequest(context: PagesContext) {
	const path = new URL(context.request.url).pathname;
	const handledByApp =
		path === "/sitemap.xml" ||
		path === "/robots.txt" ||
		path === "/api/" ||
		/^\/palpite\/[^/]+\/[^/]+\/?$/.test(path);

	if (!handledByApp) return context.next();

	return app.fetch(context.request, {
		...context.env,
		ASSETS: {
			fetch: (request: RequestInfo | URL, init?: RequestInit) => {
				const assetRequest = request instanceof Request && !init
					? request
					: new Request(request, init);
				return context.next({ request: assetRequest });
			},
		},
	});
}
