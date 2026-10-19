import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { createContext, runInContext } from 'node:vm'
import type { Rollup } from 'vite'
import { createBuilder } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

interface SystemLoader {
  instantiate: (url: string) => Promise<unknown>,
  getRegister: (url: string) => unknown,
  import: (url: string) => Promise<unknown>,
}

const require = createRequire(import.meta.url)
const { System, applyImportMap } = require('systemjs') as {
  System: { constructor: new () => SystemLoader },
  applyImportMap: (loader: SystemLoader, map: { imports: Record<string, string> }, base: string) => void,
}

test('shared plugins use the client import map when another environment disables it', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-import-map-'))
  if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir())) {
    throw new Error(`Unexpected fixture directory: ${root}`)
  }
  try {
    await Promise.all(Object.entries({
      'index.html': '<script type="module" src="/main.js"></script>',
      'main.js': 'window.load = () => import("./lazy.js").then(m => m.value)',
      'lazy.js': 'export const value = 42',
    }).map(([name, code]) => writeFile(path.join(root, name), code)))
    const builder = await createBuilder({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: legacy({ targets: 'IE 11', polyfills: false, externalSystemJS: true }),
      build: { write: false, minify: false, modulePreload: false },
      environments: {
        client: {
          build: {
            chunkImportMap: true,
          },
        },
        other: { consumer: 'client', build: { chunkImportMap: false } },
      },
      builder: { sharedPlugins: true },
    })
    const result = await builder.build(builder.environments.client)
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((bundleResult) =>
      ('output' in bundleResult ? bundleResult.output : []))
    const html = outputs.find((output) => output.type === 'asset' && output.fileName === 'index.html') as Rollup.OutputAsset
    const mapSource = String(html.source).match(/<script type="systemjs-importmap">(.*?)<\/script>/s)?.[1]
    expect(mapSource).toBeDefined()
    const importMap = JSON.parse(mapSource!) as { imports: Record<string, string> }
    const chunks = outputs.filter((output): output is Rollup.OutputChunk =>
      output.type === 'chunk' && output.fileName.includes('-legacy'))
    const base = 'https://example.com/'
    const chunksByUrl = new Map(chunks.map((chunk) => [new URL(chunk.fileName, base).href, chunk]))
    const loader = new System.constructor()
    applyImportMap(loader, importMap, base)
    const window: { load?: () => Promise<number> } = {}
    const context = createContext({ System: loader, window, URL })
    loader.instantiate = async function (url) {
      const chunk = chunksByUrl.get(url)
      if (!chunk) throw new Error(`Missing emitted chunk: ${url}`)
      runInContext(chunk.code, context, { filename: url })
      return this.getRegister(url)
    }
    const entry = chunks.find((chunk) => chunk.isEntry)!
    await loader.import(new URL(entry.fileName, base).href)
    expect(await window.load!()).toBe(42)
    for (const value of Object.values(importMap.imports)) {
      expect(chunksByUrl.has(new URL(value, base).href)).toBe(true)
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
