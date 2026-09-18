import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build gộp toàn bộ CSS/JS vào một file HTML tự chứa, để bản dist mở được
// trực tiếp bằng file:// mà không cần dev server (đúng như bản gốc một file).
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
