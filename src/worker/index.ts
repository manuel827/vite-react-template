import { Hono } from "hono";

type WorkerBindings = Env & {
	SUPABASE_URL?: string;
	SUPABASE_ANON_KEY?: string;
	VITE_SUPABASE_URL?: string;
	VITE_SUPABASE_ANON_KEY?: string;
};

type PublicTip = {
	id: string;
	league: string;
	match_date: string;
	kickoff: string;
	home_team: string;
	away_team: string;
	pick: string;
	odds: number;
	confidence: number;
	analysis: string | null;
	result: "pending" | "won" | "lost";
	score: string | null;
};

const app = new Hono<{ Bindings: WorkerBindings }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

const publicPaths = [
	"/",
	"/palpites-de-amanha",
	"/resultados",
	"/sobre-nos",
	"/termos-de-uso",
];

const slugify = (value: string) =>
	value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const tipPath = (tip: Pick<PublicTip, "id" | "home_team" | "away_team">) =>
	`/palpite/${tip.id}/${slugify(`${tip.home_team}-vs-${tip.away_team}`) || "jogo"}`;

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	})[character] ?? character);

const escapeXml = (value: string) =>
	value.replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&apos;",
	})[character] ?? character);

function supabaseConfig(env: WorkerBindings) {
	const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
	const key = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	return { url: url.replace(/\/+$/, ""), key };
}

async function getPublishedTips(env: WorkerBindings) {
	const config = supabaseConfig(env);
	if (!config) throw new Error("Supabase Worker bindings are missing.");
	const tips: Pick<PublicTip, "id" | "home_team" | "away_team">[] = [];
	const pageSize = 1000;
	for (let offset = 0; ; offset += pageSize) {
		const endpoint = new URL("/rest/v1/tips", config.url);
		endpoint.searchParams.set("select", "id,home_team,away_team");
		endpoint.searchParams.set("published", "eq.true");
		endpoint.searchParams.set("order", "id.asc");
		const response = await fetch(endpoint, {
			headers: {
				apikey: config.key,
				Authorization: `Bearer ${config.key}`,
				Range: `${offset}-${offset + pageSize - 1}`,
			},
		});
		if (!response.ok) throw new Error(`Supabase sitemap query failed (${response.status}).`);
		const page = await response.json() as Pick<PublicTip, "id" | "home_team" | "away_team">[];
		tips.push(...page);
		if (page.length < pageSize || tips.length >= 50_000) break;
	}
	return tips;
}

async function getPublishedTip(env: WorkerBindings, id: string) {
	const config = supabaseConfig(env);
	if (!config) throw new Error("Supabase Worker bindings are missing.");
	const endpoint = new URL("/rest/v1/tips", config.url);
	endpoint.searchParams.set("select", "id,league,match_date,kickoff,home_team,away_team,pick,odds,confidence,analysis,result,score");
	endpoint.searchParams.set("id", `eq.${id}`);
	endpoint.searchParams.set("published", "eq.true");
	endpoint.searchParams.set("limit", "1");
	const response = await fetch(endpoint, {
		headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
	});
	if (!response.ok) throw new Error(`Supabase tip query failed (${response.status}).`);
	const tips = await response.json() as PublicTip[];
	return tips[0] ?? null;
}

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-AO", {
	day: "2-digit",
	month: "long",
	year: "numeric",
}).format(new Date(`${value}T12:00:00`));

app.get("/sitemap.xml", async (c) => {
	const origin = new URL(c.req.url).origin;
	try {
		const tips = await getPublishedTips(c.env);
		const urls = [...publicPaths, ...tips.map(tipPath)]
			.map((path) => `\t<url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`)
			.join("\n");
		const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
		return c.body(xml, 200, {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=900",
		});
	} catch (error) {
		console.error("Unable to generate published-tip sitemap:", error);
		return c.text("Sitemap is temporarily unavailable.", 503);
	}
});

app.get("/robots.txt", (c) => {
	const origin = new URL(c.req.url).origin;
	return c.body(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`, 200, {
		"Content-Type": "text/plain; charset=utf-8",
		"Cache-Control": "public, max-age=3600",
	});
});

app.get("/palpite/:id/:slug", async (c) => {
	const { id, slug } = c.req.param();
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
		return c.text("Palpite não encontrado.", 404);
	}
	try {
		const tip = await getPublishedTip(c.env, id);
		if (!tip) return c.text("Palpite não encontrado.", 404);
		const canonicalPath = tipPath(tip);
		if (`/palpite/${id}/${slug}` !== canonicalPath) return c.redirect(canonicalPath, 301);

		const origin = new URL(c.req.url).origin;
		const canonicalUrl = `${origin}${canonicalPath}`;
		const title = `${tip.home_team} vs ${tip.away_team}: Palpite e Prognóstico | Palpites`;
		const description = `Palpite e análise de ${tip.home_team} vs ${tip.away_team}, ${tip.league}, em ${formatDate(tip.match_date)}. Conteúdo gratuito e apenas informativo.`;
		const indexResponse = await c.env.ASSETS.fetch(new Request(new URL("/", c.req.url)));
		const indexHtml = await indexResponse.text();
		const stylesheet = indexHtml.match(/<link[^>]+href="([^"]+\.css)"[^>]*>/)?.[1] ?? "";
		const stylesheetTag = stylesheet ? `<link rel="stylesheet" href="${escapeHtml(stylesheet)}">` : "";
		const outcome = tip.result === "won" ? "Acertou" : tip.result === "lost" ? "Falhou" : "Pendente";
		const safeTitle = escapeHtml(title);
		const safeDescription = escapeHtml(description);
		const html = `<!doctype html>
<html lang="pt-AO">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${safeDescription}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="article">
<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
${stylesheetTag}
<title>${safeTitle}</title>
</head>
<body>
<header class="nav"><div class="in"><a class="logo" href="/"><span class="brand-copy"><strong class="brand-name">PALPITES</strong><span class="brand-tagline">Palpites de futebol 100% grátis</span></span></a><nav class="nl" aria-label="Navegação principal"><a href="/">Palpites de hoje</a><a href="/palpites-de-amanha">Palpites de amanhã</a><a href="/resultados">Resultados</a></nav></div></header>
<main>
<section class="hero"><span class="kick">ANÁLISE DE FUTEBOL</span><h1>${escapeHtml(tip.home_team)} vs ${escapeHtml(tip.away_team)}</h1><p>${escapeHtml(tip.league)} · ${escapeHtml(formatDate(tip.match_date))} · ${escapeHtml(tip.kickoff.slice(0, 5))}</p></section>
<div class="date-heading">Palpite e prognóstico</div>
<div class="grid"><article class="card tip-card"><div class="ch"><span class="lg">${escapeHtml(tip.league)}</span><span>${escapeHtml(formatDate(tip.match_date))} · ${escapeHtml(tip.kickoff.slice(0, 5))}</span></div>
<div class="mt"><div class="tmx"><i class="cr">${escapeHtml(tip.home_team.slice(0, 3).toUpperCase())}</i><b>${escapeHtml(tip.home_team)}</b></div><div class="mid"><span class="vs">VS</span><span class="cdn">${escapeHtml(tip.kickoff.slice(0, 5))}</span></div><div class="tmx"><i class="cr">${escapeHtml(tip.away_team.slice(0, 3).toUpperCase())}</i><b>${escapeHtml(tip.away_team)}</b></div></div>
<div class="pk"><div><small>PALPITE</small><strong class="pick-text">${escapeHtml(tip.pick)}</strong></div><div class="od"><small>ODD</small><b>${Number(tip.odds).toFixed(2)}</b></div></div>
<div class="cf"><span>CONFIANÇA</span><span class="seg" aria-label="${tip.confidence} de 3">${[1, 2, 3].map((level) => `<i class="${level <= tip.confidence ? "on" : ""}"></i>`).join("")}</span><span>${tip.confidence}/3</span></div>
${tip.analysis ? `<p class="an">${escapeHtml(tip.analysis)}</p>` : ""}
${tip.result !== "pending" ? `<p class="an"><strong>Resultado:</strong> ${outcome}${tip.score ? ` · ${escapeHtml(tip.score)}` : ""}</p>` : ""}
</article></div>
<p class="tip-page-disclaimer">Não somos uma casa de apostas. Este palpite e prognóstico são apenas informativos e não garantem resultados.</p>
<p><a href="/">Ver todos os palpites no site</a></p>
</main>
<footer class="site-footer"><p>Palpites de Futebol · Conteúdo gratuito e apenas informativo. Não somos uma casa de apostas.</p><a href="/sobre-nos">Sobre nós</a> · <a href="/termos-de-uso">Termos de uso</a></footer>
<a class="vip-fixed" href="#" aria-label="Ver palpites VIP (link ainda não configurado)"><span class="vip-icon" aria-hidden="true">★</span><span>Ver palpites VIP</span><span class="vip-arrow" aria-hidden="true">↗</span></a>
</body>
</html>`;
		return c.html(html, 200, {
			"Cache-Control": "public, max-age=300",
		});
	} catch (error) {
		console.error("Unable to render published tip page:", error);
		return c.text("Página do palpite temporariamente indisponível.", 503);
	}
});

export default app;
