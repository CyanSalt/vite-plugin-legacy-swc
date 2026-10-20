import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { InlineConfig, Rollup } from 'vite'
import { createBuilder } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

async function buildClient(environments: InlineConfig['environments']) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-environments-'))
  try {
    await Promise.all(Object.entries({
      'index.html': '<script type="module" src="/main.js"></script>',
      'main.js': 'window.load = () => import("./lazy.js").then(m => m.value)',
      'lazy.js': 'export const value = 42',
    }).map(([file, code]) => writeFile(path.join(root, file), code)))
    const builder = await createBuilder({
      root,
      base: './',
      configFile: false,
      logLevel: 'silent',
      plugins: legacy({ targets: 'IE 11', polyfills: false, externalSystemJS: true }),
      build: { write: false, minify: false, modulePreload: false },
      builder: { sharedPlugins: true },
      environments,
    })
    const result = await builder.build(builder.environments.client)
    return (Array.isArray(result) ? result : [result]).flatMap((output) =>
      ('output' in output ? output.output : []))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('an SSR environment preserves client legacy output and relative asset URLs', async () => {
  const outputs = await buildClient({
    client: { build: { assetsDir: 'client-assets' } },
    ssr: { consumer: 'server', build: { ssr: true, assetsDir: 'server-assets' } },
  })
  const legacyEntry = outputs.find((output): output is Rollup.OutputChunk =>
    output.type === 'chunk' && output.isEntry && output.fileName.includes('-legacy'))!
  expect(legacyEntry.code).toContain('System.register')
  expect(legacyEntry.fileName).toMatch(/^client-assets\//)
  const html = outputs.find((output): output is Rollup.OutputAsset =>
    output.type === 'asset' && output.fileName === 'index.html')!
  expect(String(html.source)).toContain(`data-src="./${legacyEntry.fileName}"`)
})

test('shared plugins use the client import map when another environment disables it', async () => {
  const outputs = await buildClient({
    client: { build: { chunkImportMap: true } },
    other: { consumer: 'client', build: { chunkImportMap: false } },
  })
  const html = outputs.find((output): output is Rollup.OutputAsset =>
    output.type === 'asset' && output.fileName === 'index.html')!
  const mapSource = String(html.source).match(/<script type="systemjs-importmap">(.*?)<\/script>/s)?.[1]
  expect(mapSource).toBeDefined()
  const importMap = JSON.parse(mapSource!) as { imports: Record<string, string> }
  const targets = Object.values(importMap.imports).map((value) =>
    new URL(value, 'https://example.com/').pathname.slice(1))
  const lazy = outputs.find((output): output is Rollup.OutputChunk =>
    output.type === 'chunk' && output.isDynamicEntry && output.fileName.includes('-legacy'))!
  expect(targets.length).toBeGreaterThan(0)
  expect(targets).toContain(lazy.fileName)
})
