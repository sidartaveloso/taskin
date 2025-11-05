import tsConfig from './eslint/typescript.js';

export default [
  ...tsConfig,
  {
    files: ['*.js', '*.mjs', '*.ts'],
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      'build/**',
      '**/dist/**',
      '**/build/**',
      '.turbo/**',
      '.eslintcache',
      'packages/**',
    ],
  },
];
