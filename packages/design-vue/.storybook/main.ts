import type { StorybookConfig } from '@storybook/vue3-vite';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../package.json'),
    'utf-8',
  ),
);
const version = packageJson.version;

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
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
    disableWhatsNewNotifications: true, // Minimize distractions
  },

  // Static dirs for assets
  staticDirs: ['../public'],

  // Manager configuration
  managerHead: (head) => `
    ${head}
    <style>
      .sidebar-header::after {
        content: 'v${version}';
        display: inline-block;
        margin-left: 8px;
        padding: 2px 6px;
        background: #ff4785;
        color: white;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
      }
    </style>
  `,
};

export default config;
