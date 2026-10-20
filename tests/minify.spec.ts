import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire, SourceMap } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { createContext, runInContext } from 'node:vm'
import { parse } from 'acorn'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

interface SystemLoader {
  instantiate: () => Promise<unknown>,
  getRegister: () => unknown,
  import: (url: string) => Promise<unknown>,
}

const { System } = createRequire(import.meta.url)('systemjs') as {
  System: { constructor: new () => SystemLoader },
}

test.each([undefined, true, false, 'oxc'] as const)('legacy compression stays ES5 with build.minify: %s', async (minify) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-minify-'))
  try {
    await writeFile(path.join(root, 'index.html'), '<script type="module" src="/main.js"></script>')
    await writeFile(path.join(root, 'main.js'), `
      window.effects = 0;
      window.run = () => { console.log(window.effects++); return window.effects };
      window.load = () => import('./lazy.js');
    `)
    await writeFile(path.join(root, 'lazy.js'), 'export const value = 42')
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        Object.freeze({
          name: 'configure-compression',
          enforce: 'post' as const,
          configEnvironment: {
            order: 'post' as const,
            handler() {
              return { build: { minify } }
            },
          },
        }),
        ...legacy({ targets: 'IE 11', polyfills: false, externalSystemJS: true, renderModernChunks: false }),
      ],
      build: {
        write: false,
        sourcemap: minify === 'oxc',
        modulePreload: false,
        terserOptions: { compress: { drop_console: minify !== 'oxc' } },
        rolldownOptions: { output: { minify: { compress: { dropConsole: minify === 'oxc' } } } },
      },
    })
    const chunks = (Array.isArray(result) ? result : [result])
      .flatMap(output => ('output' in output ? output.output : []))
      .filter(chunk => chunk.type === 'chunk')
    expect(chunks.some(chunk => chunk.isDynamicEntry)).toBe(true)
    for (const chunk of chunks) {
      expect(() => parse(chunk.code, { ecmaVersion: 5 }), chunk.fileName).not.toThrow()
    }
    const entry = chunks.find(chunk => chunk.isEntry)!
    if (minify === 'oxc') {
      const marker = entry.code.indexOf('window.effects')
      expect(marker).toBeGreaterThan(-1)
      const position = entry.code.slice(0, marker).split('\n')
      const sourceMap = new SourceMap({ sourceRoot: '', ...entry.map! })
      expect(sourceMap.findEntry(position.length - 1, position.at(-1)!.length)).toMatchObject({
        originalSource: expect.stringContaining('main.js'), originalLine: 1,
      })
    }
    const loader = new System.constructor()
    const window = {} as { run: () => number }
    const logs: unknown[][] = []
    const context = createContext({ System: loader, window, console: { log: (...args: unknown[]) => logs.push(args) } })
    loader.instantiate = async function () {
      runInContext(entry.code, context)
      return this.getRegister()
    }
    await loader.import('https://minifier.example/entry.js')
    expect(window.run()).toBe(minify === false ? 1 : 0)
    expect(logs).toEqual(minify === false ? [[0]] : [])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects ambiguous minifier selection after the legacy post hook', async () => {
  await expect(build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      ...legacy(),
      Object.freeze({
        name: 'late-post-minifier',
        enforce: 'post' as const,
        configEnvironment: { order: 'post' as const, handler: () => ({ build: { minify: true as const } }) },
      }),
    ],
    build: { write: false },
  })).rejects.toThrow(/legacy.*after.*late-post-minifier/i)
})
