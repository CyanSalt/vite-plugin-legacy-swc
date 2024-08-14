import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import legacy from '../src'

export default defineConfig({
  root: path.dirname(fileURLToPath(import.meta.url)),
  plugins: [
    legacy({
      targets: 'IE 11',
      modernPolyfills: true,
    }),
  ],
})
