import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import type { UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/*
 * As stories do dashboard rodam no `pnpm test`, no Chromium, como as do
 * design-vue: sem isto, o `play` da tela completa so rodava quando alguem abria
 * o Storybook (task-134).
 */
export default mergeConfig(
  viteConfig as UserConfig,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(import.meta.dirname, '.storybook'),
      }),
    ],
    test: {
      name: 'storybook',
      setupFiles: ['./.storybook/vitest.setup.ts'],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright() as never,
        instances: [{ browser: 'chromium' }],
      },
    },
  }) as UserConfig,
);
