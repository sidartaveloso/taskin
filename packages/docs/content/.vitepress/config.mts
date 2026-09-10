import { defineConfig } from 'vitepress';

const REPO = 'https://github.com/opentask/taskin';
// Publicada em /components/ pelo workflow do Pages. Caminho relativo
// resolve contra o `base`, entao funciona em dev e em producao.
const COMPONENTS = '/components/';

export default defineConfig({
  title: 'Taskin',
  description: 'Task management that does not tie you to where the tasks live',

  // O site e publicado em https://opentask.github.io/taskin/ (GitHub Pages sob
  // subcaminho), entao os assets precisam da base.
  base: '/taskin/',

  /**
   * `/components/` e montada pelo workflow do Pages, nao pelo vitepress: ela e
   * o build do Storybook copiado para dentro da arvore publicada. Sem isto o
   * checador de links mata o build com "dead link /components/index", porque
   * procura uma pagina de markdown que nao existe — e nem deveria.
   */
  ignoreDeadLinks: [/^\/components\//],

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/taskin/taskin.svg' }]],

  /**
   * Ingles como raiz, portugues em `/pt-br/`.
   *
   * Segue o que o repo padronizou nos commits `db78e50`, `3db9df0` e `ca24c91`:
   * texto visivel ao usuario em ingles, interno (tasks, changesets,
   * comentarios) em portugues. O site e produto.
   *
   * O seletor de idioma nao precisa de componente: o `VPNavBar` do tema padrao
   * renderiza `VPNavBarTranslations`, que monta as opcoes a partir daqui. Com
   * `i18nRouting` (ligado por default), trocar de idioma leva a pagina
   * correspondente e nao a home.
   */
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Quickstart', link: `${REPO}/blob/main/docs/QUICKSTART.md` },
          { text: 'Components', link: COMPONENTS },
        ],
        footer: { message: 'MIT', copyright: 'OpenTask' },
      },
    },
    'pt-br': {
      label: 'Português',
      lang: 'pt-BR',
      description: 'Gerenciamento de tarefas que não amarra você ao lugar onde elas ficam',
      themeConfig: {
        nav: [
          { text: 'Quickstart', link: `${REPO}/blob/main/docs/QUICKSTART.md` },
          { text: 'Componentes', link: COMPONENTS },
        ],
        footer: { message: 'MIT', copyright: 'OpenTask' },
      },
    },
  },

  themeConfig: {
    logo: '/taskin.svg',
    socialLinks: [{ icon: 'github', link: REPO }],

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
