import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { resolve } from 'path';
import type { PluginOption } from 'vite';
import svgLoader from 'vite-svg-loader';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      svgoConfig: {
        multipass: true,
      },
    }) as PluginOption,
  ],
  test: {
    globals: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@opentask/ui-sense/mocks': resolve(__dirname, '../ui-sense/src/mocks/index.ts'),
      '@opentask/ui-sense': resolve(__dirname, '../ui-sense/src/index.ts'),
    },
  },
});
