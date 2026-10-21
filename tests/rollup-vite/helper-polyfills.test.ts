import { createContext, runInContext } from 'node:vm'
import virtual from '@rollup/plugin-virtual'
import type { PluginOption, Rollup } from 'rollup-vite'
import { build as buildWithRollup } from 'rollup-vite'
import { expect, test } from 'vitest'
import legacy from '../../src'

test('includes the builtins required by iterable spread helpers', async () => {
  const result = await buildWithRollup({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      virtual({ entry: 'window.run = value => [...value]' }),
      legacy({ targets: 'IE 11', renderModernChunks: false }) as unknown as PluginOption,
    ],
    build: {
      write: false,
      minify: false,
      modulePreload: false,
      rollupOptions: { input: 'entry' },
    },
  })
  const chunks = (Array.isArray(result) ? result : [result])
    .flatMap(output => ('output' in output ? output.output : []))
    .filter((chunk): chunk is Rollup.OutputChunk => chunk.type === 'chunk')
  const polyfill = chunks.find(chunk => chunk.fileName.includes('polyfills-legacy'))!
  const entry = chunks.find(chunk => chunk.isEntry && chunk !== polyfill)!
  const context = createContext({ console, setTimeout, clearTimeout })
  runInContext(`
    this.window = this; this.self = this;
    this.location = { href: 'https://example.com/index.html' };
    delete Array.from;
  `, context)
  runInContext(polyfill.code, context)
  const system = context.System as {
    instantiate: (url: string) => Promise<unknown>,
    getRegister: (url: string) => unknown,
    import: (url: string) => Promise<unknown>,
  }
  system.instantiate = async (url) => {
    runInContext(entry.code, context)
    return system.getRegister(url)
  }
  await system.import(new URL(entry.fileName, 'https://example.com/').href)
  const value = runInContext('window.run(new Set([1, 2]))', context)
  expect(Array.from(value as Iterable<number>)).toEqual([1, 2])
})
