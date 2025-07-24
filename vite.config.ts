import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  /* ----------  Buffer polyfill  ---------- */
  resolve: {
    alias: {
      // whenever something imports “buffer”, use the npm package instead
      buffer: 'buffer',          
    },
  },

  // make esbuild (used by Vite’s dev server) aware of the globals
  optimizeDeps: {
    include: ['buffer'],         // pre-bundle it
    esbuildOptions: {
      define: { global: 'globalThis' },

    },
  },
})
