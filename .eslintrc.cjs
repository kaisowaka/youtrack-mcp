module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
  '@typescript-eslint/no-explicit-any': 'off',
    // Disallow emojis in string literals used in logging to keep neutral tone
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='console'] Literal[value=/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{26FF}]/u]",
        message: 'Emojis are not allowed in console log messages.'
      },
      {
        selector: "CallExpression[callee.object.name='logger'] Literal[value=/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{26FF}]/u]",
        message: 'Emojis are not allowed in logger messages.'
      }
    ]
  }
};
