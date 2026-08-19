import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Ensure every dependency and application module uses the same React instance.
    dedupe: ['react', 'react-dom'],
  },
})
