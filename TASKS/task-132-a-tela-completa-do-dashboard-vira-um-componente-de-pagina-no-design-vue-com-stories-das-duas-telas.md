# 🧩 Task 132 — A tela completa do dashboard vira um componente de pagina no design-vue, com stories das duas telas

- Status: in-progress
- Type: refactor
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 13651

## Description
A barra do topo (telas, filtro de status, busca, ordem, pontuacao, contagem e conexao) e a troca entre Board e Prioritization estao escritas direto no template do App.vue de packages/dashboard, que nao tem story, e o Storybook da raiz nao varre o dashboard: a tela completa nao pode ser vista nem testada fora do dashboard rodando. O `pnpm storytype analyze` do pacote da 95/135, mas os componentes que ele conta alem do App.vue sao os exemplos do storybook init (src/stories Button, Header, Page). Levar a tela para um componente de pagina no design-vue, que recebe tarefas e conexao por props e emite as escolhas, deixar o App.vue so com a ligacao ao store, a URL e o dominio, e tirar os exemplos.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Componente de pagina no `design-vue` (nome a decidir e declarar; proposta `TaskinWorkspace`, em `packages/design-vue/src/components/pages/`), com a barra do topo e a troca entre `Dashboard` (Board) e `PrioritizationPage`
- [ ] Props: as tarefas ja recortadas, o total, os grupos, o estado da conexao (`ConnectionStatus`, task-128) e as escolhas atuais (tela, filtro de status, busca, ordem, pontuacao). Emite cada escolha e repassa os eventos da priorizacao (`update-task`, `update-group`, `move`). O componente **nao** le a URL nem o store, e nao filtra: quem aplica o recorte pelo dominio continua sendo o `App.vue` (task-129)
- [ ] `packages/dashboard/src/App.vue` fica so com a ligacao: store Pinia, URL (`?view=`, `?filter=`, `?q=`, `?sort=`, `?score=`), dominio e operacoes. Os testes de `App.spec.ts` continuam passando, com os ajustes de seletor que a mudanca pedir
- [ ] Stories da tela completa, titulo `Pages/...` pela convencao Nivel/Familia/Componente: Board, Prioritization, conexao caida com retry, recorte vazio e celular; com `play` exercitando a troca de tela, o filtro de status e a busca (as emissoes, por `fn()`)
- [ ] Remover os exemplos do `storybook init` em `packages/dashboard/src/stories/` (Button, Header, Page, Configure.mdx e o `Button.spec.ts`), que nao sao do dashboard
- [ ] Testes de componente do novo `design-vue` (jsdom), alem das stories
- [ ] Rodar `pnpm storytype analyze` em `packages/dashboard` antes e depois, e registrar os dois resultados aqui
- [ ] Changeset (minor no `design-vue`, pelo componente novo)
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`; as stories novas rodam no Chromium, que o sandbox nao tem — deixar a conferencia no navegador para fora dele

## Notes

### Por que

Tudo o que as tasks 127, 128 e 129 fizeram no topo do dashboard ficou no
template do `App.vue`, que nao tem story, e o Storybook da raiz varre so o
`design-vue` e o `ui-sense`. As stories que existem mostram partes soltas:
`Templates/Dashboard` (so o Board, com o cabecalho antigo), `Pages/PrioritizationPage`
e `Templates/PrioritizationScreen`. Nao ha onde ver a tela completa, nem a
troca entre as duas telas.

### O `storytype analyze` antes

`packages/dashboard`, 2026-09-24: 95/135 (70%). Estrutura Atomic Design 22/50
(nenhum nivel), TypeScript 30/30, Testes e Stories 22/30 (3/4 com teste, 3/4
com story), Nomenclatura 11/15 (1/4 em pasta propria), Documentacao 10/10. Os
quatro componentes contados sao o `App.vue` e os tres exemplos de
`src/stories/`: as tres stories sao dos exemplos, e o unico componente real e o
que nao tem story.

### Depois desta task

O usuario pediu, na sequencia, `pnpm storytype normalize --dry-run --verbose`
em `packages/dashboard` e depois o `normalize` de verdade.
