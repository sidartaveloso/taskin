# 🧩 Task 132 — A tela completa do dashboard vira um componente de pagina no design-vue, com stories das duas telas

- Status: done
- Type: refactor
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 13651

## Description
A barra do topo (telas, filtro de status, busca, ordem, pontuacao, contagem e conexao) e a troca entre Board e Prioritization estao escritas direto no template do App.vue de packages/dashboard, que nao tem story, e o Storybook da raiz nao varre o dashboard: a tela completa nao pode ser vista nem testada fora do dashboard rodando. O `pnpm storytype analyze` do pacote da 95/135, mas os componentes que ele conta alem do App.vue sao os exemplos do storybook init (src/stories Button, Header, Page). Levar a tela para um componente de pagina no design-vue, que recebe tarefas e conexao por props e emite as escolhas, deixar o App.vue so com a ligacao ao store, a URL e o dominio, e tirar os exemplos.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Componente de pagina no `design-vue` com a barra do topo e a troca entre `Dashboard` (Board) e `PrioritizationPage` — nome decidido: `TaskinWorkspace`, em `packages/design-vue/src/components/pages/TaskinWorkspace.vue`, exportado por `pages/index.ts` (e dali pelo pacote)
- [x] Props e emissoes — `tasks` (ja recortadas), `total`, `groups`, `view`, `filter` (o efetivo, para acender o botao), `search`, `sort`, `score`, `connectionStatus`, `statusText`, `connectionError`, `isLoading`, `title`. Emite `update:view`, `update:filter`, `update:search`, `update:sort`, `update:score`, `retry`, e repassa `update-task`, `update-group`, `move`. Nao le URL nem store e nao filtra; o titulo do Board ("Closed tasks") sai do `filter` recebido. Tipos e listas de valores em `TaskinWorkspace.types.ts` (`WorkspaceView`, `WORKSPACE_FILTERS`, ...), que o `App.vue` usa para validar o que le da URL
- [x] `packages/dashboard/src/App.vue` so com a ligacao: store, URL, dominio e operacoes, mais o aviso de prioridade (que fala com `/api/prioritize`). `App.spec.ts` passou **sem nenhum ajuste**: os stubs globais de `Dashboard` e `PrioritizationPage` alcancam os que o `TaskinWorkspace` renderiza — `cd packages/dashboard && pnpm test` (53/53)
- [x] Stories `Pages/TaskinWorkspace` (`TaskinWorkspace.stories.ts`): `Board`, `Prioritization`, `ConnectionLost`, `EmptySlice`, `Mobile` (viewport `mobile1`), com `play` clicando telas e filtros, digitando e limpando a busca, e o retry; as emissoes por `fn()`. O `play` das cinco rodou em jsdom por `composeStories` (arquivo temporario, nao versionado); para confirmar que o `play` roda de verdade, uma expectativa foi trocada de proposito e a story falhou
- [x] Removidos os exemplos do `storybook init` em `packages/dashboard/src/stories/` (Button, Header, Page, Configure.mdx, Button.spec.ts, css e assets)
- [x] Testes de componente — `packages/design-vue/src/components/pages/TaskinWorkspace.spec.ts`, 9 testes (tela padrao, troca pelo `view`, emissao sem trocar sozinho, filtro aceso e emitido, titulo pelo filtro, busca/ordem/pontuacao, contagem, conexao e retry, repasse dos eventos). `cd packages/design-vue && npx vitest run --browser.enabled=false --environment jsdom` — 318/318
- [x] `pnpm storytype analyze` em `packages/dashboard`, antes e depois — ver Notes. Depois: 83/135
- [x] Changeset — `.changeset/tela-completa-no-design-vue.md` (minor no `design-vue`, patch no `dashboard`)
- [x] Verificacao — `pnpm lint`, `pnpm typecheck`, `pnpm format` limpos. `pnpm test`: falha so o que precisa de navegador (`design-vue`, `ui-sense`) e, sob a carga paralela, os e2e da CLI e o build do docs; o docs builda sozinho, e `npx vitest run src/cli.e2e.test.ts` passou 34/34 duas vezes seguidas com a mudanca (a cada rodada que falhou, caiu um teste diferente: flaky, e a CLI nao toca nada desta task). Stories no Chromium: conferencia no navegador fica para fora do sandbox

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

### O `storytype analyze` depois

`packages/dashboard`, 2026-09-24: **83/135 (61%)**, abaixo dos 95. Estrutura
Atomic Design 13/50, TypeScript 30/30, Testes e Stories 15/30 (testes 15/15,
stories 0/15 — 0/1), Nomenclatura 15/15, Documentacao 10/10. A queda e o que
a nota de antes previa: os 95 vinham dos tres exemplos do `storybook init`;
agora o unico componente contado e o `App.vue`, que so liga store, URL e
dominio e nao tem story. A tela que ele mostra tem as suas em
`Pages/TaskinWorkspace`, no `design-vue`. Uma story do `App.vue` pediria um
store Pinia e um WebSocket falsos, e mediria a ligacao, nao a tela — fica para
decidir junto com o `normalize` pedido a seguir.
