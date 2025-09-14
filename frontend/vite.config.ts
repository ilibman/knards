import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'static/assets/[name]-[hash].js',
        chunkFileNames: 'static/assets/[name]-[hash].js',
        assetFileNames: 'static/assets/[name]-[hash][extname]',
      }
    }
  },
  plugins: [react()],
})
