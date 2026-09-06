import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Taskin',
  description: 'Gerenciamento de tarefas orientado a arquivos',
  vite: {
    build: {
      target: 'es2022',
    },
  },
});
