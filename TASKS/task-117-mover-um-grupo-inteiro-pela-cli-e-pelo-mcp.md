# 🧩 Task 117 — Mover um grupo inteiro pela CLI e pelo MCP

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1120

## Description
Mover um grupo existe so no dashboard (botoes da task-101 e setas) e nao e operacao do ITaskManager, entao o portao da task-106 nem enxerga a lacuna: e a ausencia por omissao que a RDT superficies-derivam-do-mesmo-contrato proibe. Nomear moveGroupBefore, moveGroupAfter, moveGroupToTop e moveGroupToBottom no ITaskManager, com taskin group move <grupo> --top|--bottom|--before|--after e o equivalente no MCP.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `moveGroupBefore(groupId, target)`, `moveGroupAfter(groupId, target)`, `moveGroupToTop(groupId)` e `moveGroupToBottom(groupId)` no `ITaskManager`; alvo pode ser task solta ou outro grupo
- [x] A regra de mover um **bloco** de membros no dominio, junto de `posicionarPrioridade`, reaproveitando a numeracao por passos da task-084: mover o grupo grava so os membros, como o dashboard ja faz (medido na task-101: grupo de 3 grava 3)
- [x] Entrada no `SUPERFICIES_DAS_OPERACOES` — o portao da 106 tem que exigir as tres superficies
- [x] `taskin group move <grupo> --top | --bottom | --before <task-ou-grupo> | --after <task-ou-grupo>`, exatamente uma forma, dizendo quantos arquivos gravou
- [x] O equivalente no MCP (decidir: ferramenta propria `move_group`, ou forma nova numa existente) 
- [x] Protocolo WebSocket com as operacoes de grupo, para a task-118 o dashboard usa-las
- [x] Recusar com clareza: grupo inexistente, alvo inexistente, alvo que e membro do proprio grupo, provider sem grupos (a mesma frase `GROUPS_NOT_SUPPORTED` da 105)
- [x] TDD, e suite de contrato do `ITaskManager` com os casos novos
- [x] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que

Mover um grupo existe no dashboard e em nenhuma outra superficie. Nao e uma
operacao do `ITaskManager`, entao o portao de compilacao da 106 nao a enxerga:
a ausencia na CLI e no MCP acontece por omissao, que e o que a RDT
`docs/RDT/superficies-derivam-do-mesmo-contrato.md` proibe. A task-114 registrou
"fica para quando alguem pedir"; o pedido veio.

### Ordem

Antes da 118, que precisa das operacoes de grupo no protocolo para o quadro
deixar de mover grupos por conta propria.

### Evidencia (task-117)

- **Operacoes**: `moveGroupBefore`, `moveGroupAfter`, `moveGroupToTop`, `moveGroupToBottom`
  em `packages/task-manager/src/task-manager.types.ts` e `task-manager.ts`. O alvo
  (`TaskId | GroupId`) e resolvido no manager: grupo primeiro (registro), depois tarefa;
  nenhum dos dois -> `No task or group with ID '...'`. Devolvem `{ members, changed }`.
  Testes: `task-manager.agrupar-priorizar.test.ts` > "TaskManager — mover um grupo".
- **Regra do bloco**: `posicionarGrupo` em
  `packages/task-manager/src/posicionar-prioridade/posicionar-prioridade.ts`, ao lado de
  `posicionarPrioridade`. Membros saem, voltam sem numero e contiguos no ponto, e
  `numerarPrioridade` (task-084) numera. Grupo de 3 grava 3 (teste "moveGroupToTop ...
  grupo de 3 grava 3"). "Depois de um grupo" = antes do no seguinte na fila como o quadro
  a mostra (grupo no lugar do primeiro membro). Ja no lugar -> 0 arquivos. Testes:
  `posicionar-prioridade.test.ts` > "posicionarGrupo" (14 casos).
- **Portao**: `SUPERFICIES_DAS_OPERACOES` ganhou as quatro, com `group move` / `move_group` /
  `move-group-*`. Antes da entrada, `tsc` falhava (TS2739) nos mocks e no servidor WS.
  Teste: `superficies-das-operacoes.test.ts` > "mover um grupo chega as tres superficies";
  `register.superficies.test.ts` e `task-server-mcp/src/superficies.test.ts` conferem os nomes.
- **CLI**: `taskin group move <grupo> --top|--bottom|--before <task-ou-grupo>|--after <task-ou-grupo>`
  em `packages/cli/src/commands/group.ts`; "exactly one" e "N task file(s) written" /
  "already ... no task file written". Testes: `group-priority.e2e.test.ts` > "taskin group move"
  (5 casos); `group.sem-grupos.test.ts` inclui `move`.
- **MCP**: decidido ferramenta propria `move_group` (`groupId` + exatamente um de
  `before`/`after`/`top`/`bottom`), porque em `set_priority` o sujeito e uma tarefa e
  misturar os dois deixaria as duas ambiguas; sem numero absoluto, porque um numero nao
  diz onde ficam varios membros. So anunciada com grupos. Testes:
  `task-server-mcp/src/agrupar-priorizar.test.ts` > "mover um grupo por MCP" (7 casos).
- **WebSocket**: `move-group-before`/`move-group-after` (`{ groupId, targetId }`) e
  `move-group-to-top`/`move-group-to-bottom` (`{ groupId }`) em
  `packages/task-server-ws/src/task-server-ws.ts`, respondendo `tasks` a todos; payloads em
  `PayloadsDasOperacoes` (`task-provider-pinia`), prontos para a task-118. Testes:
  `task-server-ws.operacoes.test.ts` (3 casos novos).
- **Recusas**: grupo inexistente (`Group '...' does not exist`), alvo inexistente, alvo
  membro do proprio grupo (`... is a member of group ...`), o proprio grupo como alvo, tarefa
  de outro grupo como alvo (aponta o grupo dela), provider sem grupos (`GROUPS_NOT_SUPPORTED`).
- **Contrato**: `task-manager.contract.ts` ganhou "moveGroupBefore, moveGroupAfter,
  moveGroupToTop e moveGroupToBottom movem o grupo inteiro" e "mover um grupo recusa ...".
- **Docs**: `README.md`, `packages/cli/README.md`, `docs/{QUICKSTART,MCP_CLAUDE_SETUP,MCP_VSCODE_SETUP,ARCHITECTURE}.md`,
  `docs/RDT/superficies-derivam-do-mesmo-contrato.md`, `packages/{task-manager,task-server-mcp,task-server-ws}/README.md`,
  `packages/docs/content/{index.md,pt-br/index.md}`; `.changeset/mover-grupo-pela-cli-e-pelo-mcp.md`.
- **Verificacao**: `pnpm format`, `pnpm lint` (com `TURBO_CACHE_DIR`) e `pnpm typecheck` verdes
  (typecheck depois de rebuildar `packages/ui-sense`, cujo dist estava sem `.d.ts`). Testes:
  task-manager 166, task-server-ws 36, task-server-mcp 126, pinia 12, fs-provider 405,
  dashboard 16, cli 445 (em serie). A suite de navegador de design-vue nao roda aqui (sem
  Chromium do Playwright); design-vue nao foi tocado.
- Nao feito aqui, de proposito: o dashboard passar a usar as mensagens de grupo — e a task-118.
