import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // เปลี่ยน YOUR_REPO_NAME เป็นชื่อ Repository บน GitHub หากใช้ GitHub Pages
  // เช่น /kruchat2026/
  base: process.env.NODE_ENV === 'production' ? '/kruchat2026/' : '/'
})
