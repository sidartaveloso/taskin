import globals from 'globals/index.js';

export default [
  {
    files: ['**/*.js'], // Aplica apenas a arquivos JavaScript
    ignores: ['**/dist/**', '**/node_modules/**'], // Ignora pastas específicas
    languageOptions: {
      ecmaVersion: 'latest',
      // Tipo de módulo (ESM)
      globals: {
        ...globals.node, // Adiciona variáveis globais do Node.js
        console: 'readonly', // Define console como uma variável global
      },
      // Versão do ECMAScript
      sourceType: 'module',
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Força o uso de `const` quando possível
      'no-undef': 'error',

      // Regra personalizada para console
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Permite variáveis iniciadas com _
      'prefer-const': 'error', // Erro para variáveis não definidas
    },
  },
];
