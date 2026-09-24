import type { StorybookConfig } from '@storybook/vue3-vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@storybook/addon-onboarding')],

  framework: {
    name: getAbsolutePath('@storybook/vue3-vite'),
    // `vue-component-meta` e nao o padrao `vue-docgen-api`, que o Storybook 10
    // marca como obsoleto e remove no proximo major (task-133).
    options: { docgen: 'vue-component-meta' },
  },

  // Storybook 10 features
  docs: {
    defaultName: 'Documentation',
  },

  // TypeScript configuration
  typescript: {
    check: false,
  },

  // Core configuration
  core: {
    disableTelemetry: true, // Disable telemetry for better performance
  },

  // Sem `staticDirs`: o dashboard nao serve arquivo estatico no Storybook, e a
  // entrada antiga apontava para um `public/` que nunca foi versionado — numa
  // copia limpa o Storybook recusava subir (task-131).
};

export default config;
