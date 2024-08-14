import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { expect, test } from 'vitest'

test('playground should work', async () => {
  const res = await build({
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../playground'),
  })
  expect(res).toBeTruthy()
})
