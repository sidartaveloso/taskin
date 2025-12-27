import tsConfig from '../../eslint/typescript.js';

export default [
  ...tsConfig,
  // Ensure parser resolves the package tsconfig correctly
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/*.e2e.test.ts'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'dashboard-dist/**',
      'vitest.config.ts',
      'vitest.e2e.config.ts',
      '*.config.js',
      '*.config.ts',
    ],
  },
];
