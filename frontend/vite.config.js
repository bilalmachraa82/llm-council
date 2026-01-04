import { defineConfig } from 'vite'
// Force Vercel Rebuild v2.2.1
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
