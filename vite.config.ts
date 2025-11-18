import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@iso': path.resolve(__dirname, 'src/iso'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@extensions': path.resolve(__dirname, 'src/extensions')
    }
  },
  server: {
    port: 3005,
    strictPort: true
  },
  build: {
    outDir: 'dist/renderer',
    sourcemap: true,
    target: 'esnext'
  }
});
