const parser = require('@typescript-eslint/parser');
const typescript = require('@typescript-eslint/eslint-plugin');

module.exports = [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  {
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    languageOptions: { parser, ecmaVersion: 2022, sourceType: 'module' },
    plugins: { '@typescript-eslint': typescript },
    // Start with correctness checks; formatting and stricter legacy rules can be adopted separately.
    rules: {
      'no-debugger': 'error',
      'no-unreachable': 'error',
      'no-dupe-args': 'error',
      'no-unsafe-finally': 'error',
      '@typescript-eslint/no-misused-new': 'error',
    },
  },
];
