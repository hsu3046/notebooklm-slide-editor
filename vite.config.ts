import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { geminiProxyPlugin } from './server/geminiProxy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // 서버 미들웨어(geminiProxy)에서 사용할 ENV를 process.env에 주입
  // Vite는 loadEnv 결과를 process.env에 자동 주입하지 않으므로 수동 설정 필요
  // 주의: 클라이언트 번들에는 포함되지 않음 (define 미사용)
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      geminiProxyPlugin(),
    ],
    // API 키를 클라이언트 번들에 포함하지 않음 (보안)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
