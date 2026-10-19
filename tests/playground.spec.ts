import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'
import { expect, test } from 'vitest'

test('rollup-vite playground should work', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../playground/rollup-vite')
  const require = createRequire(path.join(root, 'package.json'))
  const { build: buildWithRollup, version } = await import(pathToFileURL(require.resolve('vite')).href) as { build: typeof build, version: string }
  expect(version).toMatch(/^7\./)
  const res = await buildWithRollup({
    root,
  })
  expect(res).toBeTruthy()
})

test('rolldown-vite playground should work', async () => {
  const res = await build({
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../playground/rolldown-vite'),
  })
  expect(res).toBeTruthy()
})
