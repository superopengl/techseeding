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
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          antd: ["antd", "@ant-design/icons"],
        },
      },
    },
  },
});
