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
        index: path.resolve(__dirname, 'src/webview/main.tsx'),
      },
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.[ext]',
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
