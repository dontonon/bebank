import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  esbuild: {
    // TEMPORARILY DISABLED: Keep console.logs for debugging secret extraction issue
    // drop: mode === 'production' ? ['console', 'debugger'] : [],
    drop: [], // Keep all console.logs even in production
  },
}))
