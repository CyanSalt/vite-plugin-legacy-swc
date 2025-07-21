import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'node16',
  tsconfig: false, // disable tsconfig `paths` when bundling
  dts: true,
  outputOptions(opts, format) {
    if (format === 'cjs') {
      opts.exports = 'named'
    }
    return opts
  },
})
