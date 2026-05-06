import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
});
