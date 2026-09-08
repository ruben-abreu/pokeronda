import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: { outDir: 'dist/client' },
  server: {
    port: 3000,
    proxy: { '/api': 'http://127.0.0.1:8787' },
    watch: { useFsEvents: false, usePolling: true, interval: 1000,
      ignored: ['**/node_modules/**', '**/.wrangler/**', '**/dist/**', '**/.git/**'] },
  },
});
