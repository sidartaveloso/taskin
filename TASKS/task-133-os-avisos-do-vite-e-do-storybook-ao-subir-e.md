# 🧩 Task 133 — Os avisos do Vite e do Storybook ao subir e compilar: __dirname e vue-docgen-api

- Status: done
- Type: chore
- Assignee: sidartaveloso

## Description
Todo build e todo storybook dev imprimem dois avisos. O Vite avisa que o carregador nativo de configuracao, que vai virar o padrao, nao aceita __dirname, usado em 7 arquivos de configuracao (vite e vitest de dashboard, design-vue, ui-sense, file-system-task-provider e o vitest.workspace.ts da raiz). E o Storybook avisa que o vue-docgen-api esta obsoleto e sai no proximo major: nenhum dos quatro Storybooks (raiz, dashboard, design-vue, ui-sense) escolhe o motor de docgen, e todos caem nele. Trocar __dirname por import.meta.dirname e fixar docgen: 'vue-component-meta'.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `__dirname` vira `import.meta.dirname` em `packages/dashboard/vite.config.ts`, `packages/dashboard/vite.config.app.ts`, `packages/design-vue/vite.config.ts`, `packages/design-vue/vitest.config.ts`, `packages/file-system-task-provider/vitest.config.ts`, `packages/ui-sense/vite.config.ts` e `vitest.workspace.ts`. Prova: `npx turbo run build --force` e `pnpm typecheck` sem nenhum aviso `configLoader` (antes, um por pacote em todo build)
- [x] Os quatro Storybooks (`.storybook/main.ts` da raiz, `packages/dashboard`, `packages/design-vue`, `packages/ui-sense`) fixam `docgen: 'vue-component-meta'`. Prova: `pnpm storybook` do `design-vue` subiu sem aviso nenhum, e a pagina de Docs de `Molecules/Task/ConnectionStatus` mostrou a tabela completa — os quatro valores de `status`, os padroes de cada prop e o evento `retry`
- [x] Achado no caminho: as entradas de `test` e `test:coverage` no `turbo.json` nao incluiam `vite*.config.ts`, `vitest*.config.ts` nem `.storybook/**`. Mudar a configuracao dos testes dava cache hit e reimprimia o log antigo — foi assim que o aviso do `file-system-task-provider` pareceu continuar depois de corrigido. Acrescentadas as tres
- [ ] O aviso `import "./vite.config" without a file extension`, em `packages/design-vue/vitest.storybook.config.ts` e `packages/ui-sense/vitest.storybook.config.ts` — adiado: importar `./vite.config.ts` exige `rewriteRelativeImportExtensions`, que quebra o build do `ui-sense` (TS2876 em todo import de `.vue`), ou `allowImportingTsExtensions`, que exige `noEmit`/`emitDeclarationOnly` no proprio `tsconfig` e faz o editor acusar erro de configuracao. O carregador nativo do Vite ainda nao e o padrao; o aviso so preve o futuro
- [x] Verificacao sem cache: `npx turbo run build --force`, `pnpm typecheck`, `pnpm lint`, `npx turbo run test --force` (44/44), `pnpm test:dev-scripts`, `biome check .` verdes

## Notes

### O terceiro aviso do Storybook do dashboard

`No story files found for the specified pattern: src/**/*.stories...` nao e
desta task: e consequencia da task-132, que tirou do `packages/dashboard` os
exemplos do `storybook init`. O Storybook do pacote ficou so com o
`Introduction.mdx`, e a tela completa tem as suas stories em
`Pages/TaskinWorkspace`, no `design-vue`. Se o Storybook do pacote continua a
existir e decisao do usuario, perguntada na conversa.

### Correcao posterior (task-134)

O Storybook da **raiz** nao subia com o `vue-component-meta`
(`ts.readJsonConfigFile is not a function`): a raiz usa TypeScript 7, que nao
tem mais a API JavaScript de que ele depende. A conferencia desta task subiu so
o Storybook do design-vue, em TypeScript 6, e nao pegou. A raiz voltou ao
`vue-docgen-api`; os tres pacotes seguem com o `vue-component-meta`.
