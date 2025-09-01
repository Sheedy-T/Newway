// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
    },
    allowedHosts: ['a70fc89890cc.ngrok-free.app']
  },
  resolve: {
    alias: {
      // Your existing alias for src folder is correct
      '@': path.resolve(__dirname, './src'),
    },
  },
  // This 'define' block is the correct way to fix the 'global' error
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['simple-peer', 'socket.io-client']
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()]
    }
  }
});
