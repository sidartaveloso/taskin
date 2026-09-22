import type { StorybookConfig } from '@storybook/vue3-vite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/** Resolve o caminho absoluto de um pacote — necessario num monorepo pnpm. */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
  ],

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
};

export default config;
