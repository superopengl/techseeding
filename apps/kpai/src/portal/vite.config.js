import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// `.env` lives at the workspace root (two dirs up from src/portal). Vite's
// `loadEnv` normally only exposes `VITE_*` vars, so we pass the `KPAI_`
// prefix explicitly — keeps everything in the same namespace the API uses.
const workspaceRoot = resolve(__dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, "KPAI_");
  return {
    plugins: [react()],
    define: {
      // Exposed to client code as `__KPAI_GOOGLE_CLIENT_ID__`. Source is the
      // workspace-root `.env` so the same file feeds both the API and the build.
      // process.env fallback covers release.sh / CI where the var is exported
      // (no .env file) — without it, production builds ship an empty string
      // and the SSO button reads "configure KPAI_GOOGLE_CLIENT_ID".
      __KPAI_GOOGLE_CLIENT_ID__: JSON.stringify(
        env.KPAI_GOOGLE_CLIENT_ID || process.env.KPAI_GOOGLE_CLIENT_ID || ""
      ),
    },
    server: {
      port: 9512,
      proxy: {
        "/api": {
          target: "http://localhost:9511",
          ws: true,
        },
      },
    },
    build: {
      outDir: "../../dist/public",
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // Split per-route via React.lazy so each page only ships the antd
          // surface it actually uses (HomePage needs ~5 components + 17 icons;
          // AdminPage drags in Table/Form/Modal; SandboxPage drags in Layout
          // and friends). A single shared `antd` manualChunk forced all of
          // that onto every route — Lighthouse flagged 314 KiB unused on /.
          // React itself is still hoisted because every route depends on it.
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
  };
});
