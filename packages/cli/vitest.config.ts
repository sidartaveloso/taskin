import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    /*
     * Os e2e ficam de fora: rodam pela `vitest.e2e.config.ts`, em serie e com
     * prazo de 30s, no segundo passo do `test`. Incluidos aqui, rodavam em
     * paralelo com os prazos padrao e estouravam no runner do CI (task-136).
     */
    exclude: [...configDefaults.exclude, 'src/**/*.e2e.test.ts'],
  },
});
