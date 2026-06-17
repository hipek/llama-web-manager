import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/status': 'http://localhost:8000',
      '/models': 'http://localhost:8000',
      '/load': 'http://localhost:8000',
      '/stop': 'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
