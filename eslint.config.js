import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.ts'],

    languageOptions: {
      globals: globals.browser,
    },

    plugins: {
      unicorn,
    },

    rules: {
      'unicorn/prefer-number-properties': 'error',
    },
  },
];