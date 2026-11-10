import { defineConfig, loadEnv } from 'vite'
import process from 'node:process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  server: { proxy: { '/api': { target: process.env.API_PROXY_TARGET || loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'http://127.0.0.1:3000', changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, '') } } },
  plugins: [
    react(),
    tailwindcss(),
  ],
}))
