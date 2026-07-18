import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs Storybook play-function interaction tests (drag-and-drop, etc.) through
 * a real Chromium instance via Playwright, using @storybook/addon-vitest's
 * portable-stories integration.
 *
 * Kept as a package-local config (instead of relying only on the root
 * `vitest.workspace.ts`) because `@storybook/addon-vitest`/`@vitest/browser-playwright`
 * are devDependencies of this package, not hoisted to the repo root — the root
 * workspace file fails to resolve them when run from outside this package.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook'),
      }),
    ],
    test: {
      name: 'storybook',
      setupFiles: ['./.storybook/vitest.setup.ts'],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
    },
  }),
);
