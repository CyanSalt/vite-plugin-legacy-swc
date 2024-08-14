import config from '@cyansalt/eslint-config'

export default config({
  configs: [
    {
      languageOptions: {
        parserOptions: {
          project: './tsconfig.tools.json',
        },
      },
    },
    {
      files: ['src/**'],
      rules: {
        'unicorn/prefer-node-protocol': 'off',
      },
    },
  ],
})
