import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 填寫這行：設定相對路徑，這樣部署到 GitHub Pages 才不會找不到檔案
  base: './', 
  server: {
    port: 5173
  }
})
