import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения. 
  // Третий аргумент '' означает, что мы загружаем все переменные, а не только те, что начинаются с VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: '/RK-Grand/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    },
    // Это заменяет process.env.API_KEY в коде на значение переменной окружения во время сборки
    // Если переменная окружения не найдена (например, локально или если секрет не настроен), используется предоставленный ключ.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "AIzaSyAsOC2DeasSqJG1z4MqqRSoMY8b_xg09EE")
    }
  };
});