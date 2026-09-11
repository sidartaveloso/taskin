import type { StorybookConfig } from '@storybook/vue3-vite';
import vue from '@vitejs/plugin-vue';
import { existsSync, readFileSync, realpathSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { PluginOption } from 'vite';
import svgLoader from 'vite-svg-loader';

const here = dirname(fileURLToPath(import.meta.url));

/** Resolve o caminho absoluto de um pacote — necessario num monorepo pnpm. */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

/**
 * Storybook da raiz: **um** Storybook com as stories dos dois pacotes.
 *
 * Antes ele compunha por `refs`, apontando para os servidores de cada pacote.
 * Funcionava, mas custava tres servidores no ar para ver uma galeria, e a
 * navegacao nascia partida em duas secoes — abrir a raiz abria, na pratica,
 * dois Storybooks. Agora ele varre os dois pacotes e monta uma arvore so:
 * `Atoms/Avatar` (design-vue) e `Atoms/GestureIcon` (ui-sense) ficam lado a
 * lado, que e como um design system se le.
 *
 * Os Storybooks por pacote **continuam existindo** e nao viraram copia morta:
 * sao eles que rodam o `addon-vitest` (as play functions em navegador de
 * verdade) e que o deploy publica em `/design-vue` e `/ui-sense`. A raiz e a
 * porta de entrada; cada pacote continua dono da propria catraca de teste.
 *
 * O `preview.ts` daqui nao repete as regras: importa o do `design-vue`, que e
 * superconjunto do outro. Ver o comentario la.
 */
const config: StorybookConfig = {
  stories: [
    './welcome.mdx',
    '../packages/design-vue/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/ui-sense/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@storybook/addon-a11y')],

  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {},
  },

  docs: {
    defaultName: 'Documentation',
  },

  typescript: {
    check: false,
  },

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },

  /*
   * Sem este alias o `ui-sense` entra duas vezes na mesma pagina: as stories
   * dele vem do fonte, e as do `design-vue` importam `@opentask/ui-sense`, que
   * resolve para `dist/`. Duas copias do mesmo componente e um `dist/` que so
   * reflete o ultimo `pnpm build` — o que ja fez mudanca de fonte "nao
   * aparecer" na galeria.
   *
   * O alias e **exato**, na forma de array com regex ancorada. Na forma de
   * objeto o Vite casa por prefixo, e ai `@opentask/ui-sense/style.css` — que o
   * preview do `design-vue` importa — vira `.../src/index.ts/style.css` e
   * quebra o build com um 404 que nao explica nada. O subcaminho continua
   * resolvendo normalmente pelo `exports` do pacote.
   */
  viteFinal: (viteConfig) => {
    /*
     * O `@storybook/vue3-vite` nao registra o `@vitejs/plugin-vue` sozinho
     * aqui. A config antiga so tinha o `welcome.mdx`, entao nenhum SFC era
     * servido e a falta nao aparecia; ao varrer os pacotes, todo `.vue` passou
     * a devolver 404 — com o navegador dizendo apenas "Failed to fetch
     * dynamically imported module", que nao aponta para plugin nenhum.
     *
     * O `script.fs` nao e enfeite. Sem ele, todo SFC que faz
     * `defineProps<TipoImportado>()` quebra com "[@vue/compiler-sfc] No fs
     * option provided to compileScript in non-Node environment": resolver um
     * tipo que mora em outro arquivo exige ler o disco, e o compiler nao
     * assume acesso. Os SFCs com tipo literal inline compilam sem isso, o que
     * faz a falha parecer aleatoria — `GestureIcon` passava, `TrackingControls`
     * nao.
     */
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(
      vue({
        script: {
          fs: {
            fileExists: (file) => existsSync(file),
            readFile: (file) => readFileSync(file, 'utf-8'),
            realpath: (file) => realpathSync(file),
          },
        },
      }) as PluginOption,
    );
    viteConfig.plugins.push(svgLoader({ svgoConfig: { multipass: true } }) as PluginOption);

    viteConfig.resolve ??= {};

    const existing = viteConfig.resolve.alias;
    const asArray = Array.isArray(existing)
      ? existing
      : Object.entries(existing ?? {}).map(([find, replacement]) => ({ find, replacement }));

    viteConfig.resolve.alias = [
      { find: /^@opentask\/ui-sense$/, replacement: resolve(here, '../packages/ui-sense/src/index.ts') },
      ...asArray,
    ];

    return viteConfig;
  },

  staticDirs: [join(here, '../packages/design-vue/public')],
};

export default config;
