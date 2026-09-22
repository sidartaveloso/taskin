import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue(), svgLoader()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
