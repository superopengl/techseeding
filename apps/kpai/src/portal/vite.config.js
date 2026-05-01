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
    outDir: "../../public",
    emptyOutDir: true,
  },
});
