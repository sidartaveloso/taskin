import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // O build compila os testes para dist/, sem os __fixtures__ que eles leem
    // (task-208). Os testes rodam do src/.
    exclude: [...configDefaults.exclude, '**/dist/**'],
  },
});
