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

    return {
      'design-vue': {
        title: 'Design Vue',
        url: local ? 'http://localhost:6007' : '/design-vue',
      },
      'ui-sense': {
        title: 'UI Sense',
        url: local ? 'http://localhost:6008' : '/ui-sense',
      },
    };
  },

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
};

export default config;
