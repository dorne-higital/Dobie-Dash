import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Game logic is plain TS with no DOM, so tests run in Node without Nuxt.
export default defineConfig({
  resolve: {
    alias: { '~': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
