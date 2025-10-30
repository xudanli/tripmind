import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    // 设置环境变量
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8181'),
    'import.meta.env.VITE_API_KEY': JSON.stringify('your_api_key_here'),
    'import.meta.env.VITE_APP_ENV': JSON.stringify('development'),
    'import.meta.env.VITE_DEBUG': JSON.stringify('true'),
  },
})
