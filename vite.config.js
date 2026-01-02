import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/culonga-api': {
        target: 'https://culonga.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/culonga-api/, '/culongaPay')
      }
    }
  },
  build: {
    outDir: './server/public',
    emptyOutDir: true
  }
})
