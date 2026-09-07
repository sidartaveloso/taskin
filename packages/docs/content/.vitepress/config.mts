import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Taskin',
  description: 'Gerenciamento de tarefas orientado a arquivos, com dashboard em tempo real e ponte para agentes de IA',
  lang: 'pt-BR',

  // O site e publicado em https://opentask.github.io/taskin/ (GitHub Pages sob
  // subcaminho), entao os assets precisam da base.
  base: '/taskin/',

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/taskin/taskin.svg' }]],

  themeConfig: {
    logo: '/taskin.svg',

    nav: [
      { text: 'Quickstart', link: 'https://github.com/opentask/taskin/blob/main/docs/QUICKSTART.md' },
      { text: 'Storybook', link: 'https://opentask.github.io/taskin/beta/' },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/opentask/taskin' }],

    footer: {
      message: 'MIT',
      copyright: 'OpenTask',
    },

    // Ainda nao ha paginas de guia: o sidebar entra junto com elas, senao o
    // vitepress avisa de link morto a cada build.
  },

  vite: {
    // O default do vitepress 1.6.4 e o target antigo do Vite
    // (chrome87, edge88, es2020, firefox78, safari14), que o esbuild 0.28 nao
    // transforma mais. Ver task-045.
    //
    // Os tres precisam do mesmo alvo: `build` cobre o bundle de producao,
    // `optimizeDeps` o pre-bundling de dependencias (que e o que roda no
    // `vitepress dev`, e falhava com 454 erros no vue/vueuse) e `esbuild` a
    // transformacao do codigo do proprio site.
    build: {
      target: 'es2022',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2022',
      },
    },
    esbuild: {
      target: 'es2022',
    },
  },
});
