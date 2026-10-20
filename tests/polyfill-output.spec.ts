import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createContext, runInContext } from 'node:vm'
import type { Rollup } from 'vite'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

test('legacy polyfill output is finalized before hashing and mapping', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-polyfill-hash-'))
  try {
    await writeFile(path.join(root, 'index.html'), '<script type="module" src="/main.js"></script>')
    await writeFile(path.join(root, 'main.js'), 'window.result = Promise.resolve(42)')
    const builds: Rollup.OutputChunk[] = []
    for (const minify of [false, true]) {
      const result = await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: legacy({ targets: 'IE 11', polyfills: ['es.promise', 'es.symbol'], renderModernChunks: false }),
        build: { write: false, minify, sourcemap: true, modulePreload: false },
      })
      const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) =>
        ('output' in output ? output.output : []))
      const polyfill = outputs.find((output): output is Rollup.OutputChunk =>
        output.type === 'chunk' && output.name === 'polyfills')!
      const html = outputs.find((output): output is Rollup.OutputAsset =>
        output.type === 'asset' && output.fileName === 'index.html')!
      expect(String(html.source)).toContain(polyfill.fileName)
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
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
