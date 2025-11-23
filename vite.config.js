import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  esbuild: {
    // Strip console.logs in production builds for cleaner output and smaller bundle size
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
