import { defineConfig } from 'vite';
import reactSWC from '@vitejs/plugin-react-swc';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [reactSWC()],
});
