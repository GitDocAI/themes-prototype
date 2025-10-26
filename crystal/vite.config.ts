import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vectorSearchPlugin from './vite-plugin-vector-search'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vectorSearchPlugin()],
})
