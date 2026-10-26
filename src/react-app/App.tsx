import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import type { Tip, TipResult } from "./lib/supabase";
import "./app.css";

type Page = "today" | "tomorrow" | "results" | "terms" | "about" | "tip" | "admin";
type AdminSection = "today" | "tomorrow" | "results";

const pageFromPath = (): Page => {
	const path = window.location.pathname.replace(/\/$/, "");
	if (path === "/palpites-de-amanha") return "tomorrow";
	if (path === "/resultados") return "results";
	if (path === "/termos-de-uso") return "terms";
	if (path === "/sobre-nos") return "about";
	if (path.startsWith("/admin")) return "admin";
	if (path.startsWith("/palpite/")) return "tip";
	return "today";
};

const localDate = (offset = 0) => {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatDate = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
	new Intl.DateTimeFormat("pt-AO", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		...options,
	}).format(new Date(`${value}T12:00:00`));

const resultLabel: Record<TipResult, string> = {
	pending: "Pendente",
	won: "Acertou",
	lost: "Falhou",
};

function Brand() {
	return (
		<a className="logo" href="/" aria-label="Palpites de futebol 100% grátis, página inicial">
			<i aria-hidden="true" />
			<span className="brand-copy">
				<strong className="brand-name">PALPITES</strong>
				<span className="brand-tagline">Palpites de futebol 100% grátis</span>
			</span>
		</a>
	);
}

function Header({ page }: { page: Page }) {
	return (
		<header className="nav">
			<div className="in">
				<Brand />
				<nav className="nl" aria-label="Navegação principal">
					<a className={page === "today" ? "on" : ""} aria-current={page === "today" ? "page" : undefined} href="/">Palpites de hoje</a>
					<a className={page === "tomorrow" ? "on" : ""} aria-current={page === "tomorrow" ? "page" : undefined} href="/palpites-de-amanha">Palpites de amanhã</a>
					<a className={page === "results" ? "on" : ""} aria-current={page === "results" ? "page" : undefined} href="/resultados">Resultados</a>
				</nav>
			</div>
		</header>
	);
}

function PageMetadata({ title, description, path }: { title: string; description: string; path: string }) {
	useEffect(() => {
		document.title = title;
		const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
			let element = document.head.querySelector<HTMLMetaElement>(selector);
			if (!element) {
				element = document.createElement("meta");
				element.setAttribute(attribute, key);
				document.head.append(element);
			}
			element.content = content;
		};
		const canonicalUrl = new URL(path, window.location.origin).toString();
		setMeta('meta[name="description"]', "name", "description", description);
		setMeta('meta[property="og:title"]', "property", "og:title", title);
		setMeta('meta[property="og:description"]', "property", "og:description", description);
		setMeta('meta[property="og:type"]', "property", "og:type", "website");
		setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
		setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");
		setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
		setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
		let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
		if (!canonical) {
			canonical = document.createElement("link");
			canonical.rel = "canonical";
			document.head.append(canonical);
		}
		canonical.href = canonicalUrl;
	}, [title, description, path]);

	return null;
}

function Footer() {
	return (
		<>
			<footer className="site-footer">
				<div className="footer-main">
					<div className="footer-brand">
						<Brand />
						<p>Análises e palpites de futebol, partilhados gratuitamente para fins exclusivamente informativos.</p>
					</div>
					<div className="footer-links">
						<strong>Explorar</strong>
						<a href="/">Palpites de hoje</a>
						<a href="/palpites-de-amanha">Palpites de amanhã</a>
						<a href="/resultados">Resultados</a>
					</div>
					<div className="footer-links">
						<strong>Informações</strong>
						<a href="/sobre-nos">Sobre nós</a>
						<a href="/termos-de-uso">Termos de uso</a>
						<a href="/admin">Área do administrador</a>
					</div>
				</div>
				<p className="footer-disclaimer"><strong>Aviso:</strong> não somos uma casa de apostas, não aceitamos apostas nem movimentamos dinheiro. Os palpites, análises e resultados publicados são apenas informativos e não garantem ganhos. Aposte com responsabilidade e apenas se tiver idade legal.</p>
				<div className="footer-bottom"><span>© {new Date().getFullYear()} Palpites de Futebol. Todos os direitos reservados.</span><span>Conteúdo gratuito · Uso informativo</span></div>
			</footer>
			<a className="vip-fixed" href="#" onClick={(event) => event.preventDefault()} aria-label="Ver palpites VIP (link ainda não configurado)">
				<span className="vip-icon" aria-hidden="true">★</span>
				<span>Ver palpites VIP</span>
				<span className="vip-arrow" aria-hidden="true">↗</span>
			</a>
		</>
	);
}

function InfoPage({ page }: { page: "terms" | "about" }) {
	const isTerms = page === "terms";
	const title = isTerms ? "Termos de Uso | Palpites de Futebol" : "Sobre Nós | Palpites de Futebol";
	const description = isTerms
		? "Leia os termos de uso. Palpites de Futebol não é uma casa de apostas; análises e prognósticos são apenas informativos."
		: "Conheça o Palpites de Futebol: palpites, prognósticos e análises gratuitas, apenas informativos. Não somos uma casa de apostas.";
	return (
		<>
			<PageMetadata title={title} description={description} path={isTerms ? "/termos-de-uso" : "/sobre-nos"} />
			<Header page={page} />
			<main>
				<article className="info-page">
					<span className="kick">{isTerms ? "INFORMAÇÃO LEGAL" : "QUEM SOMOS"}</span>
					<h1>{isTerms ? "Termos de uso" : "Sobre nós"}</h1>
					{isTerms ? (
						<>
							<p className="info-lead">Ao utilizar este site, concorda com os termos abaixo. Se não concordar, não utilize o site.</p>
							<section>
								<h2>1. Natureza do serviço</h2>
								<p>Palpites de Futebol é um site de conteúdo desportivo. <strong>Não somos uma casa de apostas</strong>, não aceitamos nem processamos apostas, não gerimos contas de utilizadores em plataformas de apostas e não recebemos dinheiro para apostar em nome de terceiros.</p>
							</section>
							<section>
								<h2>2. Conteúdo apenas informativo</h2>
								<p>Palpites, análises, odds e resultados são publicados exclusivamente para fins informativos e de entretenimento. Não constituem aconselhamento financeiro, recomendação personalizada ou garantia de resultado. O futebol é imprevisível e podem existir erros ou atrasos na informação.</p>
							</section>
							<section>
								<h2>3. Responsabilidade e jogo responsável</h2>
								<p>Qualquer decisão de apostar é da exclusiva responsabilidade do utilizador. Apostar envolve risco de perda financeira e não é uma forma garantida de obter rendimento. Respeite a legislação local, a idade mínima legal e os seus limites; nunca aposte dinheiro de que precisa. Se o jogo estiver a causar problemas, procure apoio local especializado.</p>
							</section>
							<section>
								<h2>4. Disponibilidade e alterações</h2>
								<p>Podemos atualizar, corrigir ou remover conteúdos e alterar estes termos a qualquer momento. O site é fornecido tal como está, sem garantia de disponibilidade contínua ou de exatidão absoluta dos dados.</p>
							</section>
							<section>
								<h2>5. Contacto</h2>
								<p>Para questões sobre o conteúdo ou estes termos, utilize os canais de contacto disponibilizados pelo responsável pelo site.</p>
							</section>
						</>
					) : (
						<>
							<p className="info-lead">Partilhamos conteúdo de futebol gratuito para ajudar os visitantes a acompanhar jogos, análises e resultados num só lugar.</p>
							<section>
								<h2>O que fazemos</h2>
								<p>Publicamos palpites e análises editoriais sobre partidas de futebol, além de acompanhar os resultados dos palpites divulgados. O conteúdo é preparado e publicado pela administração do site.</p>
							</section>
							<section>
								<h2>O que não fazemos</h2>
								<p><strong>Não somos uma casa de apostas.</strong> Não recebemos apostas, depósitos ou pagamentos para apostar. Não prometemos ganhos nem resultados certos: todo o conteúdo é apenas informativo e gratuito.</p>
							</section>
							<section>
								<h2>Jogo responsável</h2>
								<p>As apostas envolvem riscos e podem causar perdas. Se optar por apostar, cumpra a lei e a idade mínima aplicável, estabeleça limites e nunca arrisque dinheiro essencial. O melhor é não apostar se não puder fazê-lo de forma segura.</p>
							</section>
						</>
					)}
				</article>
				<Footer />
			</main>
		</>
	);
}

function ErrorMessage({ message }: { message: string }) {
	return <div className="notice error" role="alert">{message}</div>;
}

function errorText(error: unknown) {
	return error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.";
}

function LoadingMessage() {
	return <div className="empty" role="status">A carregar palpites...</div>;
}

function ConfigurationMessage() {
	return (
		<section className="card config-message">
			<h2>Configuração necessária</h2>
			<p>Para carregar os palpites, configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no ambiente da aplicação e execute o esquema SQL incluído no projeto.</p>
		</section>
	);
}

function MatchCard({ tip, showResult = false }: { tip: Tip; showResult?: boolean }) {
	const statusClass = tip.result === "won" ? "won" : tip.result === "lost" ? "lost" : "";
	return (
		<article className="card tip-card">
			<div className="ch">
				<span className="lg">{tip.league}</span>
				<span>{formatDate(tip.match_date, { day: "2-digit", month: "short" })} · {tip.kickoff.slice(0, 5)}</span>
			</div>
			<div className="mt">
				<div className="tmx"><i className="cr">{tip.home_team.slice(0, 3).toUpperCase()}</i><b>{tip.home_team}</b></div>
				<div className="mid"><span className="vs">VS</span><span className="cdn">{tip.kickoff.slice(0, 5)}</span></div>
				<div className="tmx"><i className="cr">{tip.away_team.slice(0, 3).toUpperCase()}</i><b>{tip.away_team}</b></div>
			</div>
			<div className="pk">
				<div><small>PALPITE</small><strong className="pick-text">{tip.pick}</strong></div>
				{showResult ? (
					<span className={`rb ${statusClass}`}>{resultLabel[tip.result]}{tip.score ? ` · ${tip.score}` : ""}</span>
				) : (
					<div className="od"><small>ODD</small><b>{tip.odds.toFixed(2)}</b></div>
				)}
			</div>
			<div className="cf">
				<span>CONFIANÇA</span>
				<span className="seg" aria-label={`${tip.confidence} de 3`}>
					{[1, 2, 3].map((level) => <i className={level <= tip.confidence ? "on" : ""} key={level} />)}
				</span>
				{!showResult && <span>{tip.confidence}/3</span>}
			</div>
			{tip.analysis && <p className="an">{tip.analysis}</p>}
		</article>
	);
}

function TipPage() {
	const [tip, setTip] = useState<Tip | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const id = window.location.pathname.split("/")[2] ?? "";

	useEffect(() => {
		let active = true;
		const loadTip = async () => {
			if (!supabase) {
				setError("O serviço de palpites não está configurado.");
				setLoading(false);
				return;
			}
			try {
				const { data, error: queryError } = await supabase.from("tips").select("*").eq("id", id).eq("published", true).maybeSingle();
				if (!active) return;
				if (queryError) setError(`Não foi possível carregar este palpite: ${queryError.message}`);
				else if (!data) setError("Este palpite não existe ou não está publicado.");
				else setTip(data);
			} catch (queryError) {
				if (active) setError(`Não foi possível carregar este palpite: ${errorText(queryError)}`);
			} finally {
				if (active) setLoading(false);
			}
		};
		void loadTip();
		return () => { active = false; };
	}, [id]);

	const title = tip ? `${tip.home_team} vs ${tip.away_team}: Palpite e Prognóstico | Palpites` : "Palpite de Futebol | Palpites";
	const description = tip
		? `Palpite e análise de ${tip.home_team} vs ${tip.away_team}, ${tip.league}, em ${formatDate(tip.match_date)}. Conteúdo gratuito e apenas informativo.`
		: "Análise de jogo e palpite de futebol. Conteúdo gratuito e apenas informativo.";

	return (
		<>
			<PageMetadata title={title} description={description} path={window.location.pathname} />
			<Header page="tip" />
			<main>
				<section className="hero">
					<span className="kick">ANÁLISE DE FUTEBOL</span>
					<h1>{tip ? `${tip.home_team} vs ${tip.away_team}` : "Palpite de futebol"}</h1>
					<p>{tip ? `${tip.league} · ${formatDate(tip.match_date)} · ${tip.kickoff.slice(0, 5)}` : "Palpites e prognósticos publicados para fins informativos."}</p>
				</section>
				{loading ? <LoadingMessage /> : error ? <ErrorMessage message={error} /> : tip ? (
					<>
						<div className="date-heading">Palpite e prognóstico</div>
						<div className="grid"><MatchCard tip={tip} showResult={tip.result !== "pending"} /></div>
					</>
				) : null}
				<p className="tip-page-disclaimer">Não somos uma casa de apostas. Este conteúdo é apenas informativo e não garante resultados.</p>
				<p><a href="/">Ver todos os palpites no site</a></p>
				<Footer />
			</main>
		</>
	);
}

function PublicPage({ page }: { page: "today" | "tomorrow" | "results" }) {
	const [tips, setTips] = useState<Tip[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const date = page === "tomorrow" ? localDate(1) : localDate();

	useEffect(() => {
		let active = true;
		const loadTips = async () => {
			if (!supabase) {
				setLoading(false);
				return;
			}
			setLoading(true);
			setError("");
			try {
				let query = supabase.from("tips").select("*").eq("published", true);
				query = page === "results"
					? query.neq("result", "pending").order("match_date", { ascending: false }).order("kickoff", { ascending: false })
					: query.eq("match_date", date).order("kickoff", { ascending: true });
				const { data, error: queryError } = await query;
				if (!active) return;
				if (queryError) setError(`Não foi possível carregar os palpites: ${queryError.message}`);
				else setTips(data ?? []);
			} catch (queryError) {
				if (active) setError(`Não foi possível carregar os palpites: ${errorText(queryError)}`);
			} finally {
				if (active) setLoading(false);
			}
		};
		void loadTips();
		return () => { active = false; };
	}, [page, date]);

	const isResults = page === "results";
	const title = isResults ? "Resultados" : page === "tomorrow" ? "Palpites de amanhã" : "Palpites de hoje";
	const intro = isResults
		? "Acompanhe o desempenho dos palpites publicados."
		: page === "tomorrow"
			? "Os jogos e análises preparados para amanhã."
			: "Análises e palpites para os jogos de hoje.";
	const resolvedTips = tips.filter((tip) => tip.result !== "pending");
	const wins = resolvedTips.filter((tip) => tip.result === "won").length;
	const accuracy = resolvedTips.length ? `${Math.round((wins / resolvedTips.length) * 100)}%` : "—";
	const seoTitle = isResults
		? "Resultados de Palpites de Futebol | Palpites"
		: page === "tomorrow"
			? "Palpites de Amanhã: Prognósticos de Futebol | Palpites"
			: "Palpites de Hoje: Jogos e Prognósticos de Futebol | Palpites";
	const featuredMatches = tips.slice(0, 3).map((tip) => `${tip.home_team} vs ${tip.away_team}`);
	const seoDescription = [
		isResults
			? "Confira resultados e análises dos palpites de futebol publicados."
			: page === "tomorrow"
				? "Veja os jogos de amanhã, palpites de futebol gratuitos e prognósticos com análise."
				: "Veja os jogos de hoje, palpites de futebol gratuitos e prognósticos com análise.",
		featuredMatches.length ? `Jogos: ${featuredMatches.join(", ")}.` : "",
		"Conteúdo apenas informativo.",
	].filter(Boolean).join(" ");
	return (
		<>
			<PageMetadata title={seoTitle} description={seoDescription} path={page === "today" ? "/" : page === "tomorrow" ? "/palpites-de-amanha" : "/resultados"} />
			<Header page={page} />
			<main>
				<section className="hero">
					<span className="kick">FUTEBOL · ANÁLISES DIÁRIAS</span>
					<h1>{title}</h1>
					<p>{intro}</p>
					<div className="stats">
						<div><b>{loading ? "—" : tips.length}</b><span>{isResults ? "resultados" : "palpites"}</span></div>
						<div><b>{loading ? "—" : accuracy}</b><span>taxa de acerto</span></div>
					</div>
				</section>
				<div className="date-heading">{isResults ? "Histórico de resultados" : formatDate(date)}</div>
				{!supabase ? <ConfigurationMessage /> : loading ? <LoadingMessage /> : error ? <ErrorMessage message={error} /> : tips.length ? (
					<div className="grid">{tips.map((tip) => <MatchCard key={tip.id} tip={tip} showResult={isResults} />)}</div>
				) : (
					<div className="empty">Ainda não há {isResults ? "resultados publicados" : "palpites publicados"} para esta data.</div>
				)}
				<Footer />
			</main>
		</>
	);
}

type TipForm = {
	league: string;
	match_date: string;
	kickoff: string;
	home_team: string;
	away_team: string;
	pick: string;
	odds: string;
	confidence: string;
	analysis: string;
	result: TipResult;
	score: string;
	published: boolean;
};

const emptyForm = (date = localDate()): TipForm => ({
	league: "",
	match_date: date,
	kickoff: "18:00",
	home_team: "",
	away_team: "",
	pick: "",
	odds: "",
	confidence: "2",
	analysis: "",
	result: "pending",
	score: "",
	published: false,
});

function toForm(tip: Tip): TipForm {
	return {
		league: tip.league,
		match_date: tip.match_date,
		kickoff: tip.kickoff.slice(0, 5),
		home_team: tip.home_team,
		away_team: tip.away_team,
		pick: tip.pick,
		odds: String(tip.odds),
		confidence: String(tip.confidence),
		analysis: tip.analysis ?? "",
		result: tip.result,
		score: tip.score ?? "",
		published: tip.published,
	};
}

function AdminPage() {
	const [session, setSession] = useState<Session | null>(null);
	const [authLoading, setAuthLoading] = useState(Boolean(supabase));
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [tips, setTips] = useState<Tip[]>([]);
	const [form, setForm] = useState<TipForm>(emptyForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [adminSection, setAdminSection] = useState<AdminSection>("today");
	const [busy, setBusy] = useState(false);
	const [loadingTips, setLoadingTips] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		if (!supabase) return;
		let active = true;
		void supabase.auth.getSession().then(({ data, error: sessionError }) => {
			if (!active) return;
			if (sessionError) setError(sessionError.message);
			setSession(data.session);
			setAuthLoading(false);
		}).catch((sessionError: unknown) => {
			if (!active) return;
			setError(`Não foi possível verificar a sessão: ${errorText(sessionError)}`);
			setAuthLoading(false);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
		});
		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);

	const isAdmin = session?.user.app_metadata.role === "admin";

	const loadAdminTips = useCallback(async () => {
		if (!supabase || !isAdmin) return;
		setLoadingTips(true);
		setError("");
		try {
			const { data, error: queryError } = await supabase.from("tips").select("*").order("match_date", { ascending: false }).order("kickoff", { ascending: true });
			if (queryError) setError(`Não foi possível carregar os palpites: ${queryError.message}`);
			else setTips(data ?? []);
		} catch (queryError) {
			setError(`Não foi possível carregar os palpites: ${errorText(queryError)}`);
		} finally {
			setLoadingTips(false);
		}
	}, [isAdmin]);

	useEffect(() => {
		if (!supabase || !isAdmin) return;
		void loadAdminTips();
	}, [isAdmin, loadAdminTips]);

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!supabase) return;
		setBusy(true);
		setError("");
		try {
			const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
			if (loginError) setError(`Não foi possível iniciar sessão: ${loginError.message}`);
			else setPassword("");
		} catch (loginError) {
			setError(`Não foi possível iniciar sessão: ${errorText(loginError)}`);
		} finally {
			setBusy(false);
		}
	};

	const handleSave = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!supabase) return;
		if (adminSection === "results" && form.result === "pending") {
			setError("Escolhe se o palpite acertou ou falhou antes de publicar o resultado.");
			return;
		}
		setBusy(true);
		setError("");
		setNotice("");
		const payload = {
			league: form.league.trim(),
			match_date: form.match_date,
			kickoff: form.kickoff,
			home_team: form.home_team.trim(),
			away_team: form.away_team.trim(),
			pick: form.pick.trim(),
			odds: Number(form.odds),
			confidence: Number(form.confidence),
			analysis: form.analysis.trim() || null,
			result: form.result,
			score: form.score.trim() || null,
			published: adminSection === "results" ? true : form.published,
		};
		try {
			const request = editingId
				? supabase.from("tips").update(payload).eq("id", editingId)
				: supabase.from("tips").insert(payload);
			const { error: saveError } = await request;
			if (saveError) setError(`Não foi possível guardar: ${saveError.message}`);
			else {
				setNotice(adminSection === "results" ? "Resultado publicado. Já está disponível na página Resultados." : editingId ? "Palpite atualizado." : form.published ? "Palpite publicado." : "Palpite guardado como rascunho.");
				setForm(emptyForm(localDate(adminSection === "tomorrow" ? 1 : 0)));
				setEditingId(null);
				await loadAdminTips();
			}
		} catch (saveError) {
			setError(`Não foi possível guardar: ${errorText(saveError)}`);
		} finally {
			setBusy(false);
		}
	};

	const removeTip = async (tip: Tip) => {
		if (!supabase || !window.confirm(`Apagar o palpite ${tip.home_team} x ${tip.away_team}?`)) return;
		setBusy(true);
		setError("");
		try {
			const { error: deleteError } = await supabase.from("tips").delete().eq("id", tip.id);
			if (deleteError) setError(`Não foi possível apagar: ${deleteError.message}`);
			else {
				setNotice("Palpite apagado.");
				await loadAdminTips();
				if (editingId === tip.id) {
					setEditingId(null);
					setForm(emptyForm(localDate(adminSection === "tomorrow" ? 1 : 0)));
				}
			}
		} catch (deleteError) {
			setError(`Não foi possível apagar: ${errorText(deleteError)}`);
		} finally {
			setBusy(false);
		}
	};

	const logout = async () => {
		if (!supabase) return;
		try {
			const { error: logoutError } = await supabase.auth.signOut();
			if (logoutError) setError(`Não foi possível terminar sessão: ${logoutError.message}`);
		} catch (logoutError) {
			setError(`Não foi possível terminar sessão: ${errorText(logoutError)}`);
		}
	};

	if (!supabase) return <main className="admin-shell"><Brand /><ConfigurationMessage /></main>;
	if (authLoading) return <main className="admin-shell"><LoadingMessage /></main>;
	if (!session) {
		return (
			<main className="admin-shell">
				<Brand />
				<section className="card login-card">
					<span className="kick">ÁREA RESTRITA</span>
					<h1>Entrar no painel</h1>
					<p className="muted-copy">Entra com o email da tua conta de administrador no Supabase e a respetiva palavra-passe para publicar palpites e resultados.</p>
					{error && <ErrorMessage message={error} />}
					<form className="stack" onSubmit={handleLogin}>
						<label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
						<label>Palavra-passe<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
						<button className="btn primary" type="submit" disabled={busy}>{busy ? "A entrar..." : "Entrar"}</button>
					</form>
					<a className="back-link" href="/">Voltar ao site</a>
				</section>
			</main>
		);
	}

	if (!isAdmin) {
		return (
			<main className="admin-shell">
				<div className="admin-top"><Brand /><button className="btn" onClick={() => void logout()}>Terminar sessão</button></div>
				<ErrorMessage message="Esta conta não tem permissão de administrador. Atribua o papel admin no app_metadata através do painel seguro do Supabase." />
			</main>
		);
	}

	const updateForm = (field: keyof TipForm, value: string | boolean) =>
		setForm((current) => ({ ...current, [field]: value }));
	const visibleAdminTips = tips.filter((tip) => {
		if (adminSection === "results") return true;
		return tip.match_date === localDate(adminSection === "tomorrow" ? 1 : 0);
	});
	const openTipForEditing = (tip: Tip) => {
		setEditingId(tip.id);
		setForm(toForm(tip));
		window.scrollTo({ top: 0, behavior: "smooth" });
	};
	const chooseAdminSection = (section: AdminSection) => {
		setAdminSection(section);
		setEditingId(null);
		setForm(emptyForm(localDate(section === "tomorrow" ? 1 : 0)));
		setError("");
		setNotice("");
	};

	return (
		<main className="admin-shell">
			<div className="admin-top"><Brand /><button className="btn" onClick={() => void logout()}>Terminar sessão</button></div>
			<section className="hero admin-hero">
				<span className="kick">GESTÃO DE CONTEÚDO</span>
				<h1>Painel do administrador</h1>
				<p>Cria palpites para hoje ou amanhã, publica-os no site e atualiza o resultado após o jogo.</p>
			</section>
			<nav className="admin-sections" aria-label="Gestão de palpites">
				<button className={`btn ${adminSection === "today" ? "selected" : ""}`} type="button" onClick={() => chooseAdminSection("today")}>Palpites de hoje</button>
				<button className={`btn ${adminSection === "tomorrow" ? "selected" : ""}`} type="button" onClick={() => chooseAdminSection("tomorrow")}>Palpites de amanhã</button>
				<button className={`btn ${adminSection === "results" ? "selected" : ""}`} type="button" onClick={() => chooseAdminSection("results")}>Publicar resultados</button>
			</nav>
			{error && <ErrorMessage message={error} />}
			{notice && <div className="notice success" role="status">{notice}</div>}
			<div className="agrid">
				{adminSection === "results" && !editingId ? (
					<section className="card aform result-instructions">
						<span className="kick">APÓS O JOGO</span>
						<h2>Publicar um resultado</h2>
						<p className="form-help">Escolhe um jogo na lista. Depois, define se o palpite acertou ou falhou e informa o placar final. Ao guardar, o resultado fica disponível na página pública de Resultados.</p>
					</section>
				) : (
				<section className="card aform">
					<h2>{adminSection === "results" ? "Atualizar resultado" : editingId ? "Editar palpite" : `Novo palpite para ${adminSection === "tomorrow" ? "amanhã" : "hoje"}`}</h2>
					<p className="form-help">Os palpites são guardados no Supabase. Ao publicar, aparecem na página da data escolhida; quando definir o resultado, passam também para Resultados.</p>
					<form className="stack" onSubmit={(event) => void handleSave(event)}>
						{adminSection !== "results" && <div className="field-row">
							<label>Campeonato<input required maxLength={100} value={form.league} onChange={(event) => updateForm("league", event.target.value)} /></label>
							<label>Data do jogo<input type="date" required value={form.match_date} readOnly /></label>
						</div>}
						{adminSection !== "results" && <div className="field-row">
							<label>Hora<input type="time" required value={form.kickoff} onChange={(event) => updateForm("kickoff", event.target.value)} /></label>
							<label>Odd<input type="number" min="1.01" step="0.01" required value={form.odds} onChange={(event) => updateForm("odds", event.target.value)} /></label>
						</div>}
						{adminSection !== "results" && <div className="field-row">
							<label>Equipa da casa<input required maxLength={100} value={form.home_team} onChange={(event) => updateForm("home_team", event.target.value)} /></label>
							<label>Equipa visitante<input required maxLength={100} value={form.away_team} onChange={(event) => updateForm("away_team", event.target.value)} /></label>
						</div>}
						{adminSection !== "results" && <label>
							Palpite — uma informação por linha
							<textarea className="pick-input" required maxLength={1000} rows={5} placeholder={"Mais de 1.5 golos\nAmbas as equipas marcam"} value={form.pick} onChange={(event) => updateForm("pick", event.target.value)} />
							<span className="field-hint">{form.pick.length}/1000 caracteres. Podes separar as informações por linhas.</span>
						</label>}
						{adminSection !== "results" && <label>Confiança<select value={form.confidence} onChange={(event) => updateForm("confidence", event.target.value)}><option value="1">1 — baixa</option><option value="2">2 — média</option><option value="3">3 — alta</option></select></label>}
						{adminSection === "results" && <label>Resultado do jogo<select required value={form.result} onChange={(event) => updateForm("result", event.target.value)}><option value="pending" disabled>Pendente</option><option value="won">Acertou</option><option value="lost">Falhou</option></select></label>}
						{adminSection === "results" && <p className="form-help">Jogo: <strong>{form.home_team} vs {form.away_team}</strong> · {form.league} · {formatDate(form.match_date)}</p>}
						{adminSection === "results" && <label>Placar final<input required maxLength={20} placeholder="Ex.: 2-1" value={form.score} onChange={(event) => updateForm("score", event.target.value)} /></label>}
						{adminSection !== "results" && <label>Placar final (opcional)<input maxLength={20} placeholder="Ex.: 2-1" value={form.score} onChange={(event) => updateForm("score", event.target.value)} /></label>}
						{adminSection !== "results" && <label>Análise (opcional)<textarea rows={3} maxLength={1000} value={form.analysis} onChange={(event) => updateForm("analysis", event.target.value)} /></label>}
						{adminSection !== "results" && <label className="check-label"><input type="checkbox" checked={form.published} onChange={(event) => updateForm("published", event.target.checked)} /> Publicar no site para os visitantes</label>}
						<div className="form-actions">
							<button className="btn primary" disabled={busy} type="submit">{busy ? "A guardar..." : adminSection === "results" ? "Publicar resultado" : editingId ? "Guardar alterações" : form.published ? "Publicar palpite" : "Guardar como rascunho"}</button>
							{editingId && <button className="btn" type="button" onClick={() => { setEditingId(null); setForm(emptyForm(localDate(adminSection === "tomorrow" ? 1 : 0))); }}>Cancelar</button>}
						</div>
					</form>
				</section>
				)}
				<section className="admin-list">
					<div className="adm"><h2>{adminSection === "results" ? "Jogos para atualizar" : `Palpites ${adminSection === "tomorrow" ? "de amanhã" : "de hoje"}`} ({visibleAdminTips.length})</h2><button className="btn" disabled={loadingTips} onClick={() => void loadAdminTips()}>Atualizar</button></div>
					{loadingTips ? <LoadingMessage /> : visibleAdminTips.length ? visibleAdminTips.map((tip) => (
						<article className="card admin-tip" key={tip.id}>
							<div className="adm"><span className={`rb ${tip.published ? "won" : ""}`}>{tip.published ? "Publicado" : "Rascunho"}</span><span className="rb">{resultLabel[tip.result]}</span></div>
							<h3>{tip.home_team} <span>vs</span> {tip.away_team}</h3>
							<p>{tip.league} · {formatDate(tip.match_date)} · {tip.kickoff.slice(0, 5)}</p>
							<p><strong className="pick-text">{tip.pick}</strong> · Odd {tip.odds.toFixed(2)}{tip.score ? ` · ${tip.score}` : ""}</p>
							<div className="form-actions">
								<button className="btn" disabled={busy} onClick={() => openTipForEditing(tip)}>{adminSection === "results" ? tip.result === "pending" ? "Lançar resultado" : "Editar resultado" : "Editar"}</button>
								<button className="btn danger" disabled={busy} onClick={() => void removeTip(tip)}>Apagar</button>
							</div>
						</article>
					)) : <div className="empty">{adminSection === "results" ? "Ainda não existem jogos. Publica primeiro os palpites de hoje ou amanhã." : "Ainda não há palpites para esta data. Cria o primeiro no formulário."}</div>}
				</section>
			</div>
			<footer className="foot"><a href="/">Voltar ao site</a></footer>
		</main>
	);
}

export default function App() {
	const page = pageFromPath();
	if (page === "admin") return <AdminPage />;
	if (page === "terms" || page === "about") return <InfoPage page={page} />;
	if (page === "tip") return <TipPage />;
	return <PublicPage page={page} />;
}
