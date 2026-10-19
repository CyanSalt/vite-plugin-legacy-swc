import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { InlineConfig, Rollup } from 'vite'
import { createBuilder } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

async function buildClient(environments: InlineConfig['environments'], base = '/') {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-environments-')))
  if (path.dirname(path.resolve(root)) !== await realpath(os.tmpdir())) {
    throw new Error(`Unexpected fixture directory: ${root}`)
  }
  try {
    await writeFile(path.join(root, 'index.html'), '<script type="module" src="/main.js"></script>')
    await writeFile(path.join(root, 'main.js'), 'window.isLegacy = import.meta.env.LEGACY')
    const builder = await createBuilder({
      root,
      base,
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
  }, './')
  const legacyEntry = outputs.find((output): output is Rollup.OutputChunk =>
    output.type === 'chunk' && output.isEntry && output.fileName.includes('-legacy'))!
  expect(legacyEntry.code).toContain('System.register')
  expect(legacyEntry.fileName).toMatch(/^client-assets\//)
  const html = outputs.find((output): output is Rollup.OutputAsset =>
    output.type === 'asset' && output.fileName === 'index.html')!
  expect(String(html.source)).toContain('id="vite-legacy-entry"')
  expect(String(html.source)).toContain(`data-src="./${legacyEntry.fileName}"`)
  expect(String(html.source)).not.toContain('server-assets')
})
