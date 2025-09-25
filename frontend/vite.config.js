// Vite 빌드/개발 서버 설정
// - React SWC 플러그인 사용
// - 로컬 네트워크 접속을 허용(host: true)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Node 글로벌 사용을 위한 폴리필 (필요 시)
  define: {
    global: 'globalThis'
  },
  server: {
    // 네트워크 상 다른 기기에서 접속 가능하도록 0.0.0.0 바인딩
    host: true,
    port: 5173,      // 기본 개발 서버 포트
    strictPort: true // 사용 중이면 에러로 종료
  }
})
