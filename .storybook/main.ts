import type { StorybookConfig } from '@storybook/vue3-vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/** Resolve o caminho absoluto de um pacote — necessario num monorepo pnpm. */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

/**
 * Storybook da raiz: navegacao unica sobre os Storybooks dos pacotes.
 *
 * Ele **compoe**, nao varre. A alternativa — um glob em `packages/*` daqui —
 * funcionaria, mas criaria uma terceira copia das regras (addons, storySort,
 * modo do a11y) para manter em sincronia, e faria cada story rodar em duas
 * instancias, deixando ambiguo quem e dono da catraca de a11y e do
 * `addon-vitest`. Com `refs`, cada pacote continua dono da propria
 * configuracao e a raiz e so a porta de entrada.
 *
 * Em desenvolvimento os refs apontam para os servidores de cada pacote, que
 * precisam estar no ar (`pnpm storybook:all`). No build, apontam para as
 * subpastas onde o deploy publica cada Storybook estatico.
 */
const config: StorybookConfig = {
  stories: ['./welcome.mdx'],

  addons: [getAbsolutePath('@storybook/addon-docs')],

  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    options: {},
  },

  refs: (_config, { configType }) => {
    const local = configType === 'DEVELOPMENT';

    /*
     * `storybook dev -p N` nao falha quando a porta esta ocupada: sobe na
     * proxima livre e segue calado. Se um ref apontar para a porta pedida e o
     * servidor tiver subido em outra, a secao aparece vazia e o console mostra
     * 404 num modulo virtual — sem nada dizendo que o problema e a porta.
     * Ja aconteceu: a faixa 6006-6008 estava tomada por Storybooks de outros
     * repositorios da maquina. Dai a faixa 610x e o override por ambiente.
     */
    const refUrl = (envVar: string, port: number, staticPath: string): string => {
      if (!local) return staticPath;

      return process.env[envVar] ?? `http://localhost:${port}`;
    };

    return {
      'design-vue': {
        title: 'Design Vue',
        url: refUrl('TASKIN_SB_DESIGN_VUE_URL', 6107, '/design-vue'),
      },
      'ui-sense': {
        title: 'UI Sense',
        url: refUrl('TASKIN_SB_UI_SENSE_URL', 6108, '/ui-sense'),
      },
    };
  },

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
};

export default config;
