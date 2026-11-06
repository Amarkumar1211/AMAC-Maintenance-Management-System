import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5103,
    host: true, // listen on LAN 0.0.0.0
    proxy: {
      '/api': {
        target: 'http://localhost:5102',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5102',
        changeOrigin: true,
        ws: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 5103,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5102',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5102',
        changeOrigin: true,
        ws: true,
        secure: false,
      }
    }
  }
})
