import { createContext, runInContext } from 'node:vm'
import virtual from '@rollup/plugin-virtual'
import type { Rollup } from 'vite'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

test('legacy polyfill output is finalized before hashing and mapping', async () => {
  const builds: Rollup.OutputChunk[] = []
  for (const minify of [false, true, 'oxc'] as const) {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        virtual({ entry: '' }),
        legacy({ targets: 'IE 11', polyfills: ['es.symbol'], renderModernChunks: false }),
      ],
      build: { write: false, minify, sourcemap: true, modulePreload: false, rolldownOptions: { input: 'entry' } },
    })
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) =>
      ('output' in output ? output.output : []))
    const polyfill = outputs.find((output): output is Rollup.OutputChunk =>
      output.type === 'chunk' && output.name === 'polyfills')!
    const map = outputs.find((output): output is Rollup.OutputAsset =>
      output.type === 'asset' && output.fileName === `${polyfill.fileName}.map`)!
    expect.soft(JSON.parse(String(map.source)).mappings).toBe(polyfill.map?.mappings)
    const context = createContext({ console, setTimeout, clearTimeout })
    runInContext('this.window = this; this.self = this; this.Symbol = undefined', context)
    runInContext(polyfill.code, context)
    runInContext('Symbol("test")', context)
    builds.push(polyfill)
  }
  expect(builds[1].code).not.toBe(builds[0].code)
  expect(builds[1].fileName).not.toBe(builds[0].fileName)
})
