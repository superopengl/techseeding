import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9512,
    proxy: {
      "/api": "http://localhost:9511",
      "/ws": {
        target: "ws://localhost:9511",
        ws: true,
      },
      // Only proxy sandbox game/preview requests, not the /sandbox/:studentId SPA route
      "/sandbox": {
        target: "http://localhost:9511",
        bypass(req) {
          // Let React Router handle /sandbox and /sandbox/:sandboxId
          if (!req.url.includes("/preview")) {
            return req.url;
          }
        },
      },
    },
  },
  build: {
    outDir: "../../public",
    emptyOutDir: true,
  },
});
