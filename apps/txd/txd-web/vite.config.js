import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      components: path.resolve(__dirname, 'src/components'),
      pages: path.resolve(__dirname, 'src/pages'),
      images: path.resolve(__dirname, 'src/images'),
    },
  },
  build: {
    outDir: 'build',
  },
  server: {
    open: true,
  },
});
