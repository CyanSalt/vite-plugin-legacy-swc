module.exports = {
  root: true,
  extends: [
    '@cyansalt/preset',
  ],
  parserOptions: {
    project: './tsconfig.tools.json',
  },
  rules: {
    'unicorn/prefer-node-protocol': 'off',
  },
}
