import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'vite';

config({ quiet: true, path: resolve(__dirname, '../.env') });

const host = process.env.TAURI_DEV_HOST;
const clientPort = Number(process.env.VITE_CLIENT_PORT) || 1420;

export default defineConfig(async () => ({
  build: {
    minify: true,
    cssMinify: true,
    emptyOutDir: true,
    outDir: resolve(__dirname, '../dist'),
  },
  server: {
    port: clientPort,
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
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  clearScreen: false,
  plugins: [react(), tailwindcss()],
}));
