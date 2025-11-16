import tsConfig from '../../eslint/typescript.js';

export default [
  ...tsConfig,
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },
  {
    ignores: ['vitest.config.ts', '*.config.js', '*.config.ts', 'dist/**'],
  },
];
