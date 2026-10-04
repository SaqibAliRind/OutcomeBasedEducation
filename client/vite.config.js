import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure only one copy of React is used across all modules
    dedupe: ['react', 'react-dom', 'react-redux'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
  },
  server: {
    port: 5173,
    strictPort: false,
    // Let Vite auto-configure HMR to match whatever port it actually runs on
    hmr: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // ws: true intentionally removed — was intercepting Vite HMR WebSocket causing 400 errors
      },
    },
  },
});