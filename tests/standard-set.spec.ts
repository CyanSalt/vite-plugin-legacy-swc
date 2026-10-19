import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createContext, runInContext } from 'node:vm'
import { build } from 'vite'
import { expect, test } from 'vitest'
import legacy from '../src'

const methods = [
  'union',
  'intersection',
  'difference',
  'symmetricDifference',
  'isSubsetOf',
  'isSupersetOf',
  'isDisjointFrom',
]

test('automatic modern polyfills preserve standard Set methods and set-like arguments', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-standard-set-'))
  const source = `
    function checkSet() {
      const set = new Set([1, 2]);
      let reads = 0;
      const other = {
        get size() { reads++; return 2; },
        has: value => value === 2 || value === 3,
        keys: () => [2, 3][Symbol.iterator](),
      };
      const results = [
        Array.from(set.union(other)), Array.from(set.intersection(other)),
        Array.from(set.difference(other)), Array.from(set.symmetricDifference(other)),
        set.isSubsetOf(other), set.isSupersetOf(other), set.isDisjointFrom(other),
      ];
      return [results, reads];
    }
    window.checkSet = checkSet;
  `
  try {
    await writeFile(path.join(root, 'index.html'), '<script type="module" src="/main.js"></script>')
    await writeFile(path.join(root, 'main.js'), source)
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: legacy({ renderLegacyChunks: false, modernPolyfills: true, modernTargets: 'Chrome 100' }),
      build: { write: false, minify: false, modulePreload: false },
    })
    const chunks = (Array.isArray(result) ? result : [result])
      .flatMap(output => ('output' in output ? output.output : []))
    const polyfill = chunks.find(chunk => chunk.type === 'chunk' && chunk.name === 'polyfills')
    expect(polyfill?.type).toBe('chunk')
    if (polyfill?.type !== 'chunk') throw new Error('Missing modern polyfill chunk')

    for (const native of [true, false]) {
      const context = createContext({})
      runInContext('this.window = this; this.self = this;', context)
      const originals = methods.map(method => runInContext(`Set.prototype.${method}`, context))
      if (!native) {
        for (const method of methods) runInContext(`delete Set.prototype.${method}`, context)
      }
      runInContext(polyfill.code, context)
      if (native) {
        for (const [index, method] of methods.entries()) {
          expect.soft(runInContext(`Set.prototype.${method}`, context), method).toBe(originals[index])
        }
      }
      runInContext(source, context)
      expect.soft(JSON.parse(JSON.stringify(runInContext('checkSet()', context)))).toEqual([
        [[1, 2, 3], [2], [1], [1, 3], false, false, false],
        7,
      ])
      for (const method of methods) {
        expect.soft(runInContext(`
          try { new Set([1, 2]).${method}([2, 3]); 'accepted array'; }
          catch (error) { error.name; }
        `, context), method).toBe('TypeError')
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
