import tsConfig from '../../eslint/typescript.js';

export default [
  ...tsConfig,
  {
    ignores: [
      'dist/**',
      '**/*.d.ts',
      'vitest.config.ts',
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    files: ['src/ui.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
