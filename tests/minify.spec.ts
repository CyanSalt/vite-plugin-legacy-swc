import { createRequire } from 'node:module'
import { createContext, runInContext } from 'node:vm'
import virtual from '@rollup/plugin-virtual'
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
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      virtual({
        'entry.js': `window.effects = 0;
          window.run = () => { console.log(window.effects++); return window.effects };
          window.load = () => import('lazy.js');`,
        'lazy.js': 'export const value = 42',
      }),
      legacy({ targets: 'IE 11', polyfills: false, externalSystemJS: true, renderModernChunks: false }),
    ],
    build: {
      write: false,
      minify,
      modulePreload: false,
      terserOptions: { compress: { drop_console: minify !== 'oxc' } },
      rolldownOptions: { input: 'entry.js', output: { minify: { compress: { dropConsole: minify === 'oxc' } } } },
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
})

test('rejects ambiguous minifier selection after the legacy post hook', async () => {
  await expect(build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      ...legacy(),
      {
        name: 'late-post-minifier',
        enforce: 'post',
        configEnvironment: { order: 'post', handler: () => ({ build: { minify: true } }) },
      },
    ],
    build: { write: false },
  })).rejects.toThrow(/legacy.*after.*late-post-minifier/i)
})
