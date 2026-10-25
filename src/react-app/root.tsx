import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useLocation, type LoaderFunctionArgs } from "react-router";
import { getOrigin } from "~/lib/seo.server";
import { env } from "~/lib/env.server";
import "./app.css";

export function links() {
  return [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  return { origin: getOrigin(request), gsv: env("GOOGLE_SITE_VERIFICATION") || "" };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { origin, gsv } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  return (
    <>
      {!path.startsWith("/admin") && <link rel="canonical" href={origin + path} />}
      {gsv && <meta name="google-site-verification" content={gsv} />}
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main style={{ paddingTop: 56, textAlign: "center" }}>
      <meta name="robots" content="noindex" />
      <title>{notFound ? "Página não encontrada | SOCCER-PALPITES" : "Erro | SOCCER-PALPITES"}</title>
      <h1>{notFound ? "Página não encontrada" : "Algo correu mal"}</h1>
      <p style={{ color: "var(--mut)" }}>
        {notFound ? "O endereço que abriste não existe." : "Tenta novamente daqui a instantes."}
      </p>
      <a className="btn" href="/" style={{ display: "inline-block", width: "auto", padding: "12px 22px", textDecoration: "none", marginTop: 8 }}>
        Ir para os palpites
      </a>
    </main>
  );
}
