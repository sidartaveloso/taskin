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
    /*
     * O primeiro `import` de um comando transforma a arvore de modulos a frio.
     * Com o turbo rodando os pacotes em paralelo, isso passava dos 5s padrao e
     * o teste estourava, embora passasse isolado (task-208).
     */
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
