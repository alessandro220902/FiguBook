import { defineConfig } from 'vitest/config'

// Testa solo i sorgenti in src/, non l'output compilato in lib/.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
