import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'dev-scripts',
    root: import.meta.dirname,
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
    exclude: ['scripts/**/*.contract.test.ts'],
  },
});
