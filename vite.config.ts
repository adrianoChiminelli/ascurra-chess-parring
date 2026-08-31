import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Caminho relativo: funciona tanto em usuario.github.io/repo/ quanto na raiz.
  base: './',
})
