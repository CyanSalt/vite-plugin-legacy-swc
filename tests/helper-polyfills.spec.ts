import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createContext, runInContext } from 'node:vm'
import type * as Vite from 'vite'
import type { Rollup } from 'vite'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

const vite7Require = createRequire(new URL('../playground/rollup-vite/package.json', import.meta.url))
const vite7 = await import(pathToFileURL(vite7Require.resolve('vite')).href) as typeof Vite

test.each([
  { name: 'Vite 8', build },
  { name: 'Vite 7', build: vite7.build },
])('$name includes the builtins required by iterable spread helpers', async ({ build: viteBuild }) => {
  expect(vite7.version).toMatch(/^7\./)
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-helper-'))
  try {
    await Promise.all([
      writeFile(path.join(root, 'index.html'), '<script type="module" src="/main.js"></script>'),
      writeFile(path.join(root, 'main.js'), 'window.run = value => [...value]'),
    ])
    const result = await viteBuild({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: legacy({ targets: 'IE 11', renderModernChunks: false }),
      build: { write: false, minify: false, modulePreload: false },
    })
    const chunks = (Array.isArray(result) ? result : [result])
      .flatMap((output) => ('output' in output ? output.output : []))
      .filter((chunk): chunk is Rollup.OutputChunk => chunk.type === 'chunk')
    const polyfill = chunks.find((chunk) => chunk.fileName.includes('polyfills-legacy'))!
    const entry = chunks.find((chunk) => chunk.isEntry && chunk !== polyfill)!
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
    const value = runInContext(`window.run((function () {
      var iterable = {}, index = 0;
      iterable[Symbol.iterator] = function () {
        return { next: function () { return { value: ++index, done: index > 2 }; } };
      };
      return iterable;
    })())`, context)
    expect(Array.from(value as Iterable<number>)).toEqual([1, 2])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
