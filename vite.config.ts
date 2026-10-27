import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import path from 'path';

function removeCrossOriginFromCss() {
  return {
    name: 'remove-crossorigin-from-css',
    transformIndexHtml(html: string) {
      return html.replace(/<link rel="stylesheet" crossorigin\s*/g, '<link rel="stylesheet" ');
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'chrome >= 65', 'edge >= 79', 'firefox >= 62', 'safari >= 12', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    removeCrossOriginFromCss(),
  ],
  build: {
    target: ['chrome67', 'edge79', 'firefox62', 'safari12'],
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
