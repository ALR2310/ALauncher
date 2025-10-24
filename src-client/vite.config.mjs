import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { ENV } from '../shared/enums/general.enum';
import { analyzer } from 'vite-bundle-analyzer';


config({ quiet: true, path: resolve('..', '.env') });

const host = process.env.TAURI_DEV_HOST;
const clientPort = Number(process.env.VITE_PORT) + 1 || 2311;
const isDev = process.env.NODE_ENV === ENV.Development;


export default defineConfig(async () => ({
  build: {
    minify: !isDev,
    cssMinify: !isDev,
    emptyOutDir: true,
    outDir: resolve('..', 'dist'),
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'vendor_react';
          }
        }
      }
    }
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
  plugins: [react(), tailwindcss(), analyzer({
    openAnalyzer: false,
    analyzerMode: 'static',
  })],
}));
