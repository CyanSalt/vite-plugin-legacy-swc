import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Rollup } from 'vite'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

test('an HTML entry containing -legacy keeps a modern script and a SystemJS fallback', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-output-'))
  try {
    await writeFile(path.join(root, 'page-legacy.html'), '<script type="module" src="/main.js"></script>')
    await writeFile(path.join(root, 'main.js'), 'window.isLegacy = import.meta.env.LEGACY')
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: legacy({ targets: 'IE 11', polyfills: false, externalSystemJS: true }),
      build: {
        write: false,
        minify: false,
        modulePreload: false,
        rolldownOptions: { input: 'page-legacy.html' },
      },
    })
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) =>
      ('output' in output ? output.output : []))
    const html = outputs.find((output): output is Rollup.OutputAsset =>
      output.type === 'asset' && output.fileName === 'page-legacy.html')!
    const scripts = [...String(html.source).matchAll(/<script\b[^>]*>/g)].map(([script]) => script)
    const modernScript = scripts.find((script) => script.includes('type="module"') && script.includes('src="'))!
    expect(modernScript).toBeDefined()
    const modernFileName = modernScript.match(/\bsrc="([^"]+)"/)![1].replace(/^\//, '')
    const modernChunk = outputs.find((output): output is Rollup.OutputChunk =>
      output.type === 'chunk' && output.fileName === modernFileName)!
    expect(modernChunk.code).not.toContain('System.register')
    const fallback = scripts.find((script) => script.includes('id="vite-legacy-entry"'))!
    expect(fallback).toContain('nomodule')
    const legacyFileName = fallback.match(/\bdata-src="([^"]+)"/)![1].replace(/^\//, '')
    const legacyChunk = outputs.find((output): output is Rollup.OutputChunk =>
      output.type === 'chunk' && output.fileName === legacyFileName)!
    expect(legacyChunk.code).toContain('System.register')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
