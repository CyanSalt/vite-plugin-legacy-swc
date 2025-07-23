import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    testTimeout: 20000,
  },
  esbuild: {
    target: 'node20',
  },
})
