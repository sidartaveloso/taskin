import tsConfig from '../../eslint/typescript.js';

export default [
  ...tsConfig.map((config) => {
    if (config.languageOptions?.parserOptions) {
      return {
        ...config,
        languageOptions: {
          ...config.languageOptions,
          parserOptions: {
            ...config.languageOptions.parserOptions,
            projectService: false,
            project: './tsconfig.eslint.json',
            tsconfigRootDir: import.meta.dirname,
          },
        },
      };
    }
    return config;
  }),
  {
    ignores: ['dist/**', 'vitest.config.ts', '*.config.js', '*.config.ts'],
  },
];
