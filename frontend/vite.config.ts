import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8000,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:9000',
      '/status': 'http://localhost:9000',
      '/models': 'http://localhost:9000',
      '/load': 'http://localhost:9000',
      '/stop': 'http://localhost:9000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
