import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { URL } from 'url'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
