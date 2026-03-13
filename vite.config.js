import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Node.js gelen header isimlerini küçük harfe çevirir
            const raw = (req.headers['x-client-api-key'] || process.env.VITE_ANTHROPIC_API_KEY || '').trim();
            const key = raw.replace(/[^\x20-\x7E]/g, '').trim();
            if (key) {
              proxyReq.setHeader('x-api-key', key);
            }
            proxyReq.removeHeader('x-client-api-key');
            proxyReq.removeHeader('X-Client-Api-Key');
          });
        },
      },
    },
  },
});
