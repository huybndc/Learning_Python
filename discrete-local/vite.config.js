import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { htmlInclude } from './shared/vite-plugin-include.js';

const page = p => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [htmlInclude()],
  resolve: {
    alias: {
      '@shared': page('./shared'),
    },
  },
  server: { port: 5191, strictPort: true },
  preview: { port: 5191, strictPort: true },
  build: { chunkSizeWarningLimit: 800 },
  test: { include: ['tests/**/*.test.js'] },
});
