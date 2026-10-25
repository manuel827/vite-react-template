import { type RouteConfig, index, route } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("palpites-de-amanha", "routes/home.tsx", { id: "amanha" }),
  route("resultados", "routes/home.tsx", { id: "resultados" }),
  route("sitemap.xml", "routes/sitemap.tsx"),
  route("robots.txt", "routes/robots.tsx"),
  route("admin/login", "routes/admin.login.tsx"),
  route("admin", "routes/admin.tsx"),
  route("sobre-nos", "routes/sobre-nos.tsx"),
  route("termos-de-uso", "routes/termos-de-uso.tsx"),
] satisfies RouteConfig;
