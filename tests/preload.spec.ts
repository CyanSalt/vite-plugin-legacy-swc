import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { createContext, runInContext } from 'node:vm'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

interface SystemLoader {
  instantiate: (url: string) => Promise<unknown>,
  getRegister: (url: string) => unknown,
  import: (url: string) => Promise<unknown>,
}

const { System } = createRequire(import.meta.url)('systemjs') as {
  System: { constructor: new () => SystemLoader },
}

test('legacy entries with shared chunks start without fetch in a modulepreload DOM', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-preload-'))
  try {
    await Promise.all(Object.entries({
      'index.html': '<script type="module" src="/main.js"></script>',
      'main.js': `
        import { value } from './shared.js'
        window.result = value
      `,
      'shared.js': 'export const value = "shared"',
    }).map(([file, code]) => writeFile(path.join(root, file), code)))
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: legacy({ targets: 'IE 11', polyfills: false, externalSystemJS: true }),
      build: {
        write: false,
        minify: false,
        rolldownOptions: {
          output: { advancedChunks: { groups: [{ name: 'shared', test: /shared\.js$/ }] } },
        },
      },
    })
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((output) =>
      ('output' in output ? output.output : []))
    const html = outputs.find((output) => output.type === 'asset' && output.fileName === 'index.html')
    expect(html?.type === 'asset' && String(html.source)).toContain('rel="modulepreload"')
    const legacyChunks = outputs.filter((output) => output.type === 'chunk' && output.fileName.includes('-legacy'))

    const base = 'https://example.com/'
    const modules = new Map(legacyChunks.map((chunk) => [new URL(chunk.fileName, base).href, chunk]))
    const loader = new System.constructor()
    const window: Record<string, unknown> = {}
    const context = createContext({
      System: loader,
      window,
      document: {
        createElement: () => ({ relList: { supports: () => false } }),
        querySelectorAll: () => [{ href: '/assets/shared.js' }],
      },
      MutationObserver: class {
        observe() {}
      },
    })
    loader.instantiate = async function (url) {
      const chunk = modules.get(url)
      if (chunk?.type !== 'chunk') throw new Error(`Missing emitted chunk: ${url}`)
      runInContext(chunk.code, context, { filename: url })
      return this.getRegister(url)
    }
    const entry = legacyChunks.find((chunk) => chunk.type === 'chunk' && chunk.isEntry)!
    await loader.import(new URL(entry.fileName, base).href)
    expect(window.result).toBe('shared')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
