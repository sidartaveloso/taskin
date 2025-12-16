import tsConfig from '../../eslint/typescript.js';

export default [
  ...tsConfig,
  {
    ignores: ['vitest.config.ts', '*.config.js', '*.config.ts', 'dist/**'],
  },
];
