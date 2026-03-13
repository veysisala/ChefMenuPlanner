import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const key = (req.headers['x-client-api-key'] || req.headers['X-Client-Api-Key'] || process.env.VITE_ANTHROPIC_API_KEY || '').trim();
            if (key) proxyReq.setHeader('x-api-key', key);
            proxyReq.removeHeader('x-client-api-key');
          });
        },
      },
    },
  },
});
