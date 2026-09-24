# 🧩 Task 119 — Grupos aninhados de verdade: um grupo pode estar dentro de outro, nas tres superficies

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1140

## Description
O dashboard deixa criar um subgrupo (soltar uma task sobre outra do mesmo grupo) e aninhar um grupo em outro (soltar um grupo sobre outro), mas o dominio nao sabe guardar isso: o Group so tem id e name, e a task guarda um grupo so. O aninhamento vive apenas na arvore da tela e se desfaz quando a lista volta do servidor ou a pagina recarrega. A task-118 expos isso ao levar o quadro a mover pelo dominio: o passo 5 da story Drag And Drop Interactions passou a falhar. Levar o aninhamento ao dominio (grupo pai no Group e no registro de grupos), as operacoes nomeadas no ITaskManager e as tres superficies.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] RDT em `docs/RDT/` com o modelo: onde mora o pai (proposta: `parentId` opcional no `Group`, em `packages/types-ts/src/taskin.schemas.ts`), profundidade maxima (decidir e declarar), e o que "a task esta no grupo" passa a significar
- [ ] `Group` ganha o pai; o registro de grupos (`IGroupRegistry`, `packages/task-manager/src/group-registry.types.ts`, e o do provider de arquivos em `packages/file-system-task-provider/src/group-registry.ts`) grava e le o pai no `.taskin-groups.json`, com a suite `group-registry.contract.ts` cobrindo
- [ ] Recusas no dominio: pai inexistente, ciclo (A dentro de B dentro de A), grupo dentro de si mesmo, profundidade acima do teto
- [ ] Apagar um grupo que tem subgrupos: decidir e declarar (proposta: os filhos sobem para o pai do apagado, como o `reassignTo` ja faz com as tasks)
- [ ] Operacoes nomeadas no `ITaskManager`: criar grupo com pai, `nestGroup(groupId, parentId)` e `unnestGroup(groupId)`, entrando no `SUPERFICIES_DAS_OPERACOES` — o portao da 106 exige as tres superficies. Aproveitar para levar `createGroup` ao contrato, que hoje e so uma consulta do servidor WebSocket fora do portao
- [ ] Ordem: `ordenarTarefas`/`agruparTarefas` montam a arvore aninhada (o grupo ocupa o lugar do primeiro membro de toda a sua subarvore); `posicionarGrupo` e `moveGroup*` (task-117) movem o bloco da subarvore inteira, gravando so os membros
- [ ] CLI: `taskin group create <nome> --parent <grupo>`, `taskin group nest <grupo> <pai>`, `taskin group unnest <grupo>`; `taskin group list` mostra a hierarquia; `taskin list` em texto indenta os subgrupos
- [ ] `taskin list --json`: a estrutura aninhada no JSON (grupo com `tasks` e `groups`), sem achatar — a saida serve qualquer ferramenta, e achatar perde a informacao
- [ ] MCP: as mesmas operacoes, e `list_groups` com o pai
- [ ] `taskin lint`: acusa pai inexistente e ciclo no `.taskin-groups.json`
- [ ] Protocolo WebSocket com as operacoes; o dashboard (`App.vue`, `operacoes-da-mudanca`) passa a mandar criar subgrupo e aninhar grupo pelo dominio, e a montar a arvore a partir do pai de cada grupo (`buildPriorityTree` no `use-prioritization`)
- [ ] Desfazer e refazer do aninhamento, como os outros movimentos da 118
- [ ] As stories `Drag And Drop Interactions` (passo 5, subgrupo) e `Group Drag Interactions` (passo 2, grupo sobre grupo) em `packages/design-vue/src/components/pages/PrioritizationPage.stories.ts` passam **com o hospedeiro** que a revisao da 118 acrescentou, e que precisa aprender as operacoes novas. No sandbox o Chromium nao sobe: cobrir o mesmo fluxo em jsdom e deixar a story para a verificacao fora do sandbox
- [ ] Aninhamento sobrevive ao recarregar: teste que grava pela operacao, relê do provider e confere a arvore
- [ ] TDD em cada camada, e suite de contrato do `ITaskManager` e do registro com os casos novos
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

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
