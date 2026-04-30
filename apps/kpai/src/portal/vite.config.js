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
      // Only proxy sandbox game file requests, not the /sandbox/:studentId SPA route
      "/sandbox": {
        target: "http://localhost:9511",
        bypass(req) {
          // Let React Router handle /sandbox/:studentId (no /game/ in path)
          if (!req.url.includes("/game/")) {
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
