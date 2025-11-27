import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "./frontend/src/core"),
      "@modules": path.resolve(__dirname, "./frontend/src/modules"),
      "@": path.resolve(__dirname, "./frontend/src/core"),
    },
  },
  root: path.resolve(__dirname, 'frontend'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  }
})
