import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 渲染端（Vue）构建配置
export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false
  }
})
