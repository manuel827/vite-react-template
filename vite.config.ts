import { readFileSync } from "node:fs";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

type WranglerConfig = {
	vars?: Record<string, string>;
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "VITE_");
	const wrangler = JSON.parse(readFileSync(new URL("./wrangler.json", import.meta.url), "utf8")) as WranglerConfig;
	const supabaseUrl = wrangler.vars?.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
	const supabaseAnonKey = wrangler.vars?.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY;

	return {
		plugins: [react(), cloudflare()],
		define: {
			"import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
			"import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
		},
	};
});
