import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // เปลี่ยน YOUR_REPO_NAME เป็นชื่อ Repository บน GitHub หากใช้ GitHub Pages
  // เช่น /teacher-dev-log/
  base: process.env.NODE_ENV === 'production' ? '/teacher-dev-log/' : '/'
})
