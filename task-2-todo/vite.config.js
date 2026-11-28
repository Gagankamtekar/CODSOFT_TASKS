import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error(
              '\n[proxy] Could not reach the push server on port 4000.',
              '\nStart it with: cd server && npm run dev\n',
              err.code
            )
          })
        },
      },
    },
  },
})