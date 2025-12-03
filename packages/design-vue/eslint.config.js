// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import vuePlugin from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'storybook-static/**',
      'node_modules/**',
      'vite.config.ts',
      'vitest.config.ts',
      'vite.config.app.ts',
      '**/*.stories.ts',
    ],
  },
  ...tseslint.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/attributes-order': 'off', // Conflita com prettier-plugin-organize-attributes
      'vue/html-self-closing': 'off', // Conflita com Prettier
      'storybook/no-renderer-packages': 'off',
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.stories.ts'],
    rules: {
      'storybook/no-renderer-packages': 'off',
    },
  },
);
