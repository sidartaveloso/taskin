# Task 029 — substituir eslint por biome

- Status: done
- Type: refactor
- Assignee: sidarta-veloso

## Description

para aumentar performance e compatibilidade com o vue, substituir o eslint pelo biome

## Tasks

- [x] Analisar situação atual: eslint + prettier em todos os pacotes, exceto design-vue e ui-sense (que já usam biome)
- [x] Atualizar biome.json com regras equivalentes: Vue, TS, imports consistentes, no-console
- [x] Atualizar scripts de lint/format nos package.json de todos os pacotes:
  - packages/core, api, cli, types-ts, task-manager, utils, file-system-task-provider, git-utils, task-server-ws, task-server-mcp, task-provider-pinia
- [x] Remover eslint.config.js de todos os pacotes (14 arquivos)
- [x] Remover devDependencies de eslint, prettier e plugins do package.json raiz
- [x] Remover devDependencies de eslint dos package.json de pacotes individuais
- [x] Remover eslint/ diretório com configs compartilhadas (index.js, typescript.js, vue.js)
- [x] Remover eslint.config.js raiz e dev/eslint.config.js
- [x] Remover types-ts/.eslintignore
- [x] Remover .prettierrc
- [x] Atualizar .vscode/settings.json (trocar prettier por biome, remover eslint codeActions)
- [x] Atualizar .vscode/extensions.json (remover eslint e prettier, adicionar biome)
- [x] Remover eslint-disable comments de scripts
- [x] Atualizar scripts raiz: ci, lint, format no package.json
- [x] Rodar pnpm install e verificar lint/format

## Notes

Add any relevant notes or links here.
