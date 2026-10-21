import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative base so the same build works at localhost and at
  // https://sawla-1.github.io/computer-baisc/
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
})
