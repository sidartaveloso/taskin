import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**'],
    /*
     * Os testes de integracao abrem dezenas de processos `git` cada um. No
     * `pnpm test` o turbo roda todos os pacotes em paralelo, e os 5s padrao
     * estouravam com a CPU disputada, embora passassem isolados (task-208).
     */
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
