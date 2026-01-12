
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // ВАЖНО: Замените '/rk-grand-ecosystem/' на название вашего репозитория,
    // если оно отличается. Например: '/my-project/'
    base: '/rk-grand-ecosystem/',
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    }
  };
});
