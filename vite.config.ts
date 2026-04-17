import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: false,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
