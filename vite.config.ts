import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  build: {
    minify: false,
    cssMinify: false,
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
    },
  },
  clearScreen: false,
  plugins: [react(), tailwindcss()],
}));
