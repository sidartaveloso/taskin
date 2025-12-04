import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import baseConfig from './index.js';

export default [
  ...baseConfig, // Estende a configuração base,
  {
    files: ['**/*.{ts,tsx,types.ts,test.ts}'],
    ignores: [
      'dist/**',
      'node_modules/**',
      '.directus/**', // Ignorar arquivos gerados
    ],
  },
  {
    files: ['**/*.{ts,tsx,types.ts,test.ts}'], // Aplica a arquivos TypeScript, .types.ts e .test.ts
    languageOptions: {
      parser: tsParser, // Define o parser do TypeScript
      parserOptions: {
        ecmaVersion: 'latest',
        projectService: true,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // Adiciona o plugin do TypeScript
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],

      '@typescript-eslint/explicit-function-return-type': 'off',

      '@typescript-eslint/no-explicit-any': 'warn',
      // Regras específicas do TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
