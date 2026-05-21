import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_URL
    ? env.VITE_API_URL.replace(/\/api$/, '')
    : 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: mode === 'development'
        ? { '/api': { target: proxyTarget, changeOrigin: true } }
        : undefined,
    },
    preview: {
      host: '0.0.0.0',
      port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
      allowedHosts: ['stock-3i0i.onrender.com'],
    },
  };
});
