import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'chrome >= 65', 'edge >= 79', 'firefox >= 62', 'safari >= 12', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
  ],
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 65 << 16,
        edge: 79 << 16,
        firefox: 62 << 16,
        safari: 12 << 16,
      },
    },
  },
  build: {
    target: ['chrome67', 'edge79', 'firefox62', 'safari12'],
    cssTarget: ['chrome65', 'edge79', 'firefox62', 'safari12'],
  },
  resolve: {
    alias: {
      '@': path.resolve('.', 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
