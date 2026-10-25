import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    /*
     * Os testes de integracao do autoSync abrem dezenas de processos `git`. No
     * `pnpm test` o turbo roda os pacotes em paralelo, e os 5s padrao
     * estouravam com a CPU disputada, embora passassem isolados (task-208).
     */
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@opentask/taskin-types': path.resolve(import.meta.dirname, '../types-ts/src/index.ts'),
      '@opentask/taskin-git-utils': path.resolve(import.meta.dirname, '../git-utils/src/index.ts'),
    },
  },
});
