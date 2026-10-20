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

test('automatic modern polyfills preserve native standard Set methods', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-swc-standard-set-'))
  const source = `const set = new Set(); ${methods.map(method => `set.${method}(set);`).join('\n')}`
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
    if (polyfill?.type !== 'chunk') throw new Error('Missing modern polyfill chunk')

    const context = createContext({})
    const originals = methods.map(method => runInContext(`Set.prototype.${method}`, context))
    runInContext(polyfill.code, context)
    for (const [index, method] of methods.entries()) {
      expect(runInContext(`Set.prototype.${method}`, context), method).toBe(originals[index])
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
