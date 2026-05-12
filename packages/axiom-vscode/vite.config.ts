import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/webview',
    emptyDirOnly: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/webview/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/webview'),
    },
  },
  server: {
    port: 3000,
  },
});
