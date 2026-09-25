# 🧩 Task 134 — O TaskinWorkspace mora no dashboard, e as stories do dashboard entram na galeria e no pnpm test

- Status: in-progress
- Type: refactor
- Assignee: sidartaveloso

## Description
A task-132 pos a tela completa do dashboard no design-vue como Pages/TaskinWorkspace. Mas o design-vue e a biblioteca de pecas; a tela e desta aplicacao, e o dashboard e o unico que a usa. Mover o TaskinWorkspace, com stories e testes, para packages/dashboard, compondo as pecas do design-vue; incluir as stories do dashboard no Storybook da raiz, que hoje varre so design-vue e ui-sense; e rodar os testes das stories do dashboard no pnpm test, no Chromium, como o design-vue faz. O Storybook do pacote, que ficou vazio depois da 132, passa a mostrar a tela.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O `TaskinWorkspace` (componente, tipos, testes e stories) sai de `packages/design-vue/src/components/pages/` para `packages/dashboard/src/components/pages/`, por `git mv`, e compoe as pecas pelo pacote (`Dashboard`, `PrioritizationPage`, `ConnectionStatus`, os tipos e o `taskId` vem de `@opentask/taskin-design-vue`). O `design-vue` deixa de exporta-lo. Prova: `vue-tsc --noEmit` do dashboard limpo, e os 9 testes de `TaskinWorkspace.spec.ts` passam no dashboard
- [x] As stories usam um mock proprio, `TaskinWorkspace.mock.ts`: o `MOCK_DASHBOARD_TASKS` do design-vue nao sai do pacote, e abrir um ponto de entrada `mocks` la teria as armadilhas que o `ui-sense` documenta no `vite.config.ts` (nome da CSS e `.d.ts`)
- [x] O `test` do `packages/dashboard` era `vitest run || true` — engolia qualquer falha desde 2026-01-08 (`c750ec7`). Passa a `vitest run && vitest run --config vitest.storybook.config.ts`
- [x] As stories do dashboard rodam no `pnpm test`, no Chromium: `packages/dashboard/vitest.storybook.config.ts` e `.storybook/vitest.setup.ts`, no molde do design-vue, com `@storybook/addon-vitest`, `@vitest/browser`, `@vitest/browser-playwright` e `playwright` nas devDependencies. Prova: `@opentask/taskin-dashboard:test` com 62 testes em jsdom e 5 stories no Chromium
- [x] O preview do Storybook do dashboard carrega o CSS do design-vue (`@opentask/taskin-design-vue/style.css`); antes carregava so as fontes. Conferido: `Pages/TaskinWorkspace/Prioritization` com grupo, dificuldade e a barra estilizados, console sem erros; `pnpm storybook` do pacote sobe sem aviso e lista o `TaskinWorkspace` (antes: `No story files found`)
- [x] O Storybook da raiz varre `packages/dashboard/src/**/*.stories.*`, com o `@opentask/taskin-design-vue` resolvido para o fonte, para o mesmo componente nao entrar duas vezes na pagina (como ja era com o `ui-sense`). Conferido: `index.json` com as 6 entradas de `Pages/TaskinWorkspace`, e a story `Board` renderizando sem erro
- [x] Achado no caminho: o Storybook da raiz nao subia desde a task-133 (`ts.readJsonConfigFile is not a function`). A raiz usa TypeScript 7, sem a API JavaScript de que o `vue-component-meta` depende; os pacotes, em TypeScript 6, seguem com ele. A raiz volta ao `vue-docgen-api`, com o motivo no `.storybook/main.ts`
- [x] Changeset: `.changeset/tela-completa-do-dashboard.md`, reescrito a partir do da 132 (que ainda nao tinha sido publicado e dizia que a pagina nascia no design-vue)
- [x] `pnpm storytype analyze` em `packages/dashboard`: 98/135 (73%), com Testes e Stories 30/30. Antes da 132: 95/135, com as tres stories dos exemplos do `storybook init`; depois da 132: 83/135, sem nenhuma
- [x] Verificacao sem cache: `npx turbo run build --force`, `pnpm typecheck`, `pnpm lint`, `npx turbo run test --force` (44/44), `pnpm test:dev-scripts`, `biome check .` verdes

## Notes

### Por que no dashboard

O design-vue e a biblioteca de pecas, que serve a mais de uma aplicacao. O
`TaskinWorkspace` e a tela desta aplicacao: os rotulos, as telas oferecidas e o
que vai na barra sao do dashboard, e ele e o unico que a usa. Morando aqui, o
Storybook do pacote passa a mostrar a tela, e o `storytype analyze` do pacote
mede um componente real.
