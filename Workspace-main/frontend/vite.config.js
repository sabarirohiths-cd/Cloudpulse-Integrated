import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/topology-app': {
        target: process.env.VITE_TOPOLOGY_FRONTEND_URL || 'http://localhost:5174',
        changeOrigin: true,
        secure: false,
        headers: {
          'Host': 'localhost'
        }
      },
      '/api': {
        target: process.env.VITE_API_PROXY_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
