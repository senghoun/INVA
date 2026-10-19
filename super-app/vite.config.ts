import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const port = Number(env.VITE_PORT) || 5174;
  const gatewayUrl = env.VITE_GATEWAY_URL || 'http://127.0.0.1:3000';
  const atriaUrl = env.VITE_ATRIA_API_URL || 'https://api.atria-asi.ai';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port,
      host: true,
      proxy: {
        '/api': {
          target: gatewayUrl,
          changeOrigin: true,
        },
        '/atria-api': {
          target: atriaUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/atria-api/, ''),
          secure: false,
        },
      },
    },
  };
});
