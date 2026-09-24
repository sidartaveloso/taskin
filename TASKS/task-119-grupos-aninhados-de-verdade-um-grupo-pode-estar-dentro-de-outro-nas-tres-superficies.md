# 🧩 Task 119 — Grupos aninhados de verdade: um grupo pode estar dentro de outro, nas tres superficies

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 4200

## Description
O dashboard deixa criar um subgrupo (soltar uma task sobre outra do mesmo grupo) e aninhar um grupo em outro (soltar um grupo sobre outro), mas o dominio nao sabe guardar isso: o Group so tem id e name, e a task guarda um grupo so. O aninhamento vive apenas na arvore da tela e se desfaz quando a lista volta do servidor ou a pagina recarrega. A task-118 expos isso ao levar o quadro a mover pelo dominio: o passo 5 da story Drag And Drop Interactions passou a falhar. Levar o aninhamento ao dominio (grupo pai no Group e no registro de grupos), as operacoes nomeadas no ITaskManager e as tres superficies.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] RDT em `docs/RDT/` com o modelo: onde mora o pai (proposta: `parentId` opcional no `Group`, em `packages/types-ts/src/taskin.schemas.ts`), profundidade maxima (decidir e declarar), e o que "a task esta no grupo" passa a significar — `docs/RDT/grupos-aninhados.md`: pai no grupo (`parentId`), teto de 4 niveis (`PROFUNDIDADE_MAXIMA_DE_GRUPO`), membro direto x subarvore
- [x] `Group` ganha o pai; o registro de grupos (`IGroupRegistry`, `packages/task-manager/src/group-registry.types.ts`, e o do provider de arquivos em `packages/file-system-task-provider/src/group-registry.ts`) grava e le o pai no `.taskin-groups.json`, com a suite `group-registry.contract.ts` cobrindo — `setParent?` no registro; suite nova `runGroupNestingContractTests`, provada por `file-system-task-provider/src/group-registry.test.ts` ("o pai fica no .taskin-groups.json, e outra instancia o le") e por `task-manager/src/group-registry.memory.test.ts`
- [x] Recusas no dominio: pai inexistente, ciclo (A dentro de B dentro de A), grupo dentro de si mesmo, profundidade acima do teto — `validarAninhamento` em `task-manager/src/aninhar-grupos/`; `aninhar-grupos.test.ts` ("validarAninhamento"), contrato "recusa o grupo dentro de si mesmo, e o ciclo", "recusa passar do teto de niveis"
- [x] Apagar um grupo que tem subgrupos: decidir e declarar (proposta: os filhos sobem para o pai do apagado, como o `reassignTo` ja faz com as tasks) — decidido como proposto (RDT, secao "Apagar"); contrato "apagar um grupo sobe os subgrupos para o pai dele" e "... da raiz leva os subgrupos para a raiz"; `taskin group remove` diz quantos subiram
- [x] Operacoes nomeadas no `ITaskManager`: criar grupo com pai, `nestGroup(groupId, parentId)` e `unnestGroup(groupId)`, entrando no `SUPERFICIES_DAS_OPERACOES` — o portao da 106 exige as tres superficies. Aproveitar para levar `createGroup` ao contrato, que hoje e so uma consulta do servidor WebSocket fora do portao — `createGroup(name, { id?, parentId? })`, `nestGroup`, `unnestGroup`; o `typecheck` recusou (TS1360) ate a tabela cobrir as tres; `superficies-das-operacoes.test.ts` "criar e aninhar grupos chegam as tres superficies (task-119)"; contrato do `ITaskManager` com 5 casos novos (`task-manager.contract.ts`); `NESTING_NOT_SUPPORTED` em `task-manager.agrupar-priorizar.test.ts` "aninhamento como capacidade"
- [x] Ordem: `ordenarTarefas`/`agruparTarefas` montam a arvore aninhada (o grupo ocupa o lugar do primeiro membro de toda a sua subarvore); `posicionarGrupo` e `moveGroup*` (task-117) movem o bloco da subarvore inteira, gravando so os membros — `agruparTarefas(…, pais)` com `groups`/`items`; `ordenar-tarefas.test.ts` "agruparTarefas com subgrupos"; `posicionar-prioridade.test.ts` "posicionarGrupo e posicionarNoExtremo com subgrupos" (8 casos); contrato "mover o grupo pai leva a subarvore inteira, e o subgrupo vai ao topo do pai"
- [x] CLI: `taskin group create <nome> --parent <grupo>`, `taskin group nest <grupo> <pai>`, `taskin group unnest <grupo>`; `taskin group list` mostra a hierarquia; `taskin list` em texto indenta os subgrupos — `packages/cli/src/commands/{group,list}.ts` (`add` segue como apelido de `create`); `group.aninhar.test.ts` (11 casos), `list.grupos-aninhados.test.ts`, e pelo binario `npx vitest run --config vitest.e2e.config.ts src/commands/group-nest.e2e.test.ts` (3 casos)
- [x] `taskin list --json`: a estrutura aninhada no JSON (grupo com `tasks` e `groups`), sem achatar — a saida serve qualquer ferramenta, e achatar perde a informacao — `{ group: { id, name, parentId?, hidden }, tasks, groups }`; "--json aninha o subgrupo dentro do pai, com parentId" e o e2e "list --json aninha o subgrupo, e o texto o indenta sob o pai"
- [x] MCP: as mesmas operacoes, e `list_groups` com o pai — `create_group`, `nest_group`, `unnest_group` (os dois ultimos so anunciados com `setParent`); `task-server-mcp/src/grupos-aninhados.test.ts` (6 casos); `superficies.test.ts` e `documented-tools.test.ts` verdes
- [x] `taskin lint`: acusa pai inexistente e ciclo no `.taskin-groups.json` — `validarAninhamentoDosGrupos` (erro; profundidade acima do teto e aviso); `validar-priorizacao.test.ts` "validarAninhamentoDosGrupos" e `file-system-task-provider.grupos-aninhados.test.ts` "o lint acusa pai inexistente e ciclo no .taskin-groups.json"
- [x] Protocolo WebSocket com as operacoes; o dashboard (`App.vue`, `operacoes-da-mudanca`) passa a mandar criar subgrupo e aninhar grupo pelo dominio, e a montar a arvore a partir do pai de cada grupo (`buildPriorityTree` no `use-prioritization`) — `create-group` (com `parentId`), `nest-group`, `unnest-group` no `task-server-ws` (`task-server-ws.operacoes.test.ts`, 3 casos novos); `operacaoDoGrupo` (`operacoes-da-mudanca.test.ts`); `App.spec.ts` "um subgrupo novo vira create-group com o pai..." e "aninhar e desaninhar..."; `buildPriorityTree(tasks, collapsed, grupos)`, `changedGroups` e o evento `update-group` (sai antes de `update-task`, `PrioritizationPage.spec.ts`)
- [x] Desfazer e refazer do aninhamento, como os outros movimentos da 118 — o historico guarda o pai de cada grupo; `use-prioritization.aninhamento.test.ts` "desfazer e refazer o aninhamento, como os outros movimentos"
- [x] As stories `Drag And Drop Interactions` (passo 5, subgrupo) e `Group Drag Interactions` (passo 2, grupo sobre grupo) em `packages/design-vue/src/components/pages/PrioritizationPage.stories.ts` passam **com o hospedeiro** que a revisao da 118 acrescentou, e que precisa aprender as operacoes novas. No sandbox o Chromium nao sobe: cobrir o mesmo fluxo em jsdom e deixar a story para a verificacao fora do sandbox — o hospedeiro saiu para `PrioritizationPage.hospedeiro.ts` (grava `update-group` e devolve os grupos), o mesmo das stories e de `PrioritizationPage.hospedada.spec.ts`, que roda os sete passos e o grupo sobre grupo em jsdom (`npx vitest run --browser.enabled=false --environment=jsdom src/components/pages/PrioritizationPage.hospedada.spec.ts`). Conferido que os dois casos falham com o hospedeiro sem os grupos. A story no navegador fica para fora do sandbox
- [x] Aninhamento sobrevive ao recarregar: teste que grava pela operacao, relê do provider e confere a arvore — `file-system-task-provider.grupos-aninhados.test.ts` "o aninhamento sobrevive ao recarregar"; no quadro, `use-prioritization.aninhamento.test.ts` "o subgrupo sobrevive a volta da lista e dos grupos"
- [x] TDD em cada camada, e suite de contrato do `ITaskManager` e do registro com os casos novos — cada suite acima foi vista vermelha antes da implementacao
- [x] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas — mais `docs/RDT/{grupos-aninhados,superficies-derivam-do-mesmo-contrato}.md`, `docs/{QUICKSTART,ARCHITECTURE,MCP_CLAUDE_SETUP,MCP_VSCODE_SETUP}.md`, READMEs de `task-manager`, `task-server-mcp`, `task-server-ws`, e `.changeset/grupos-aninhados.md`
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` — lint, typecheck e `format:check` verdes (`TURBO_CACHE_DIR=/tmp/turbo-cache`); `pnpm test` verde exceto `design-vue`, que no `turbo` falha so por nao achar o Chromium do Playwright — sob jsdom passa inteiro (35 arquivos, 301 testes). cli 474 (`--no-file-parallelism`), task-manager 218, fs-provider 420, mcp 146, ws 42, dashboard 24, pinia 12, dev-scripts 85

## Notes

### O defeito que isto corrige

O dashboard oferece dois gestos de aninhamento que o produto nao sabe guardar:

- soltar uma task sobre outra do **mesmo** grupo cria um subgrupo;
- soltar um grupo sobre outro cria um grupo pai com os dois dentro.

O `Group` do dominio tem so `id` e `name`, e a task guarda um grupo so. O
aninhamento existia apenas na arvore local do `usePrioritization`, e se desfaz
quando a lista volta do servidor ou a pagina recarrega — uma opcao que parece
funcionar e perde o que fez.

A task-118 expos isso: desde que o quadro move pelo dominio, a lista volta a
cada movimento, e o passo 5 da story `Drag And Drop Interactions` passou a
falhar com dois grupos soltos no lugar do subgrupo. Antes a story passava porque
nada fazia a viagem de ida e volta.

### Decisao do usuario

Entre tirar o aninhamento do dashboard e implementa-lo de verdade, a escolha foi
implementar.

### Onde isto toca

`packages/types-ts/src/taskin.schemas.ts` (`GroupSchema`),
`packages/task-manager/src/group-registry.*`,
`packages/file-system-task-provider/src/group-registry.ts`,
`packages/task-manager/src/ordenar-tarefas/`,
`packages/task-manager/src/posicionar-prioridade/`,
`packages/task-manager/src/superficies-das-operacoes/`,
`packages/cli/src/commands/{group,list,new}.ts`,
`packages/task-server-mcp/src/task-server-mcp.ts`,
`packages/task-server-ws/src/task-server-ws.ts`,
`packages/dashboard/src/{App.vue,operacoes-da-mudanca}`,
`packages/design-vue/src/composables/use-prioritization/`.

### Provider sem a capacidade

Grupos ja sao capacidade opcional (task-079). Um provider pode ter grupos e nao
ter aninhamento: decidir se o aninhamento e parte do registro de grupos ou uma
capacidade propria, e a CLI dizer em uma frase quando nao houver.
