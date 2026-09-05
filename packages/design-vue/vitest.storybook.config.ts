import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import type { UserConfig } from 'vite';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  viteConfig as UserConfig,
  defineConfig({
    plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook'),
      }),
    ],
    /*
     * `aria-query` e CJS sem `exports`, e o pre-bundle do Vite no modo browser
     * nao detectava seus named exports — o setup do addon-vitest quebrava com
     * "does not provide an export named 'elementRoles'". Incluir explicitamente
     * faz o Vite converter CJS para ESM com os nomes preservados.
     */
    optimizeDeps: {
      include: ['aria-query'],
    },
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
