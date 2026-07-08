import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@opentask/taskin-types': path.resolve(
        __dirname,
        '../types-ts/src/index.ts',
      ),
      '@opentask/taskin-git-utils': path.resolve(
        __dirname,
        '../git-utils/src/index.ts',
      ),
    },
  },
});
