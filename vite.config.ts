import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const apiProxy = process.env.VITE_API_PROXY;

  return {
    plugins: [react()],
    server: {
      proxy: apiProxy
        ? {
            '/api': {
              target: apiProxy,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  };
});
