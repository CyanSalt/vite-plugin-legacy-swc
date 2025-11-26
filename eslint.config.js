import config from '@cyansalt/eslint-config'

export default config({
  configs: [
    {
      languageOptions: {
        parserOptions: {
          project: [
            './playground/tsconfig.json',
            './tsconfig.lib.json',
            './tsconfig.node.json',
          ],
        },
      },
    },
  ],
})
