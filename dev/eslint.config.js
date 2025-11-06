import tseslint from 'typescript-eslint';
import baseConfig from '../../eslint/typescript.js';

export default tseslint.config(...baseConfig, {
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
