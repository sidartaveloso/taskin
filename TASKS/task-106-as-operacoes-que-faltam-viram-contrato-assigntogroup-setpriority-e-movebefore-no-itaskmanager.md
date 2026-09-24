# 🧩 Task 106 — As operacoes que faltam viram contrato: assignToGroup, setPriority e moveBefore no ITaskManager

- Status: done
- Type: refactor
- Assignee: sidartaveloso
- Priority: 1021
- Group: g-n1xf2yf7

## Description
Hoje o dashboard escreve pelo update generico do ITaskProvider, enquanto a CLI e o MCP passam pelo ITaskManager. Priorizar e agrupar existem so no primeiro caminho, e por isso existem so no dashboard: nunca foram nomeadas como operacoes, sao efeito colateral de um update. Nomear assignToGroup, removeFromGroup, setPriority, moveBefore e moveAfter no ITaskManager e fazer o dashboard usa-las, de modo que a CLI e o MCP ganhem as operacoes sem trabalho proprio e o update generico deixe de ser a porta dos fundos. Em seguida generalizar o portao de compilacao que o FilterCriteriaSchema ja tem para os criterios, agora para as operacoes. Ver docs/RDT/superficies-derivam-do-mesmo-contrato.md.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `assignToGroup(taskId, groupId)` e `removeFromGroup(taskId)` no `ITaskManager` — entregues na task-105 (`packages/task-manager/src/task-manager.types.ts`, `task-manager.ts`); conferidos aqui pela suite de contrato (`assignToGroup grava o grupo na tarefa`, `... recusa um grupo que nao existe, sem gravar`, `removeFromGroup tira a tarefa do grupo`)
- [x] `setPriority(taskId, priority)` — da task-105; contrato `setPriority grava o numero, e recusa o que nao e inteiro positivo`
- [x] `moveBefore(taskId, targetId)` e `moveAfter(taskId, targetId)`, reaproveitando a numeracao por passos da task-084 — da task-105 (`posicionarPrioridade` sobre `numerarPrioridade`); contrato `moveBefore e moveAfter poem a tarefa do lado pedido da referencia`. **Acrescentado aqui:** `setDifficulty(taskId, difficulty)`, porque pontuar tambem so existia pelo `update` generico — contrato `setDifficulty grava de 1 a 5, e recusa o resto sem gravar`
- [x] O dashboard passa a usar as operacoes nomeadas no lugar do `update` generico — `operacoesDaMudanca` em `packages/dashboard/src/operacoes-da-mudanca/` traduz o que o quadro mudou (8 testes em `operacoes-da-mudanca.test.ts`); `App.vue` manda cada uma por `taskStore.operar()` (testes `App — o quadro de priorizacao grava por operacoes nomeadas` em `App.spec.ts`, inclusive `dois membros de um grupo novo criam o grupo uma vez so`). O `updateTask` do store Pinia recusa sempre (`pinia-task-provider.operacoes.test.ts`)
- [x] O protocolo do servidor WebSocket carrega as operacoes, e nao a task inteira para gravar — `set-priority`, `set-difficulty`, `assign-to-group`, `remove-from-group`, `move-before`, `move-after`, `create-group`; `update` e `applyTaskUpdate` removidos. 10 testes contra servidor e `TaskManager` de verdade em `packages/task-server-ws/src/task-server-ws.operacoes.test.ts` (`o update generico nao existe mais: e recusado, e nada e gravado`, `create-group e assign-to-group, em sequencia, agrupam — o servidor atende na ordem`, ...). Smoke manual: `taskin dashboard` num projeto temporario, cliente `ws` mandando `update` (recusado) e depois as operacoes — o arquivo ficou com `Priority: 30`, `Difficulty: 4`, `Group: g-smoke`, e o grupo no `.taskin-groups.json`
- [x] A CLI e o MCP expoem as operacoes (e o que a task-105 entrega, agora sem caminho proprio) — `taskin group join/leave`, `taskin priority`; `join_group`, `leave_group`, `set_priority` (task-105). Conferido aqui contra a tabela: `packages/cli/src/commands/register.superficies.test.ts` (cada comando declarado existe) e `packages/task-server-mcp/src/superficies.test.ts` (cada ferramenta declarada e anunciada). `setDifficulty` fica **declaradamente** sem CLI e sem MCP, com o motivo na tabela
- [x] Portao de compilacao: acrescentar operacao e esquecer uma superficie precisa **nao compilar** — `SUPERFICIES_DAS_OPERACOES ... satisfies Record<OperacaoDoManager, SuperficiesDaOperacao>` em `packages/task-manager/src/superficies-das-operacoes/`; o servidor WebSocket tipa os handlers por `NomeNaSuperficie<'ws'>`. Prova: os `@ts-expect-error` de `superficies-das-operacoes.test.ts` (tabela sem `setDifficulty`, handlers sem `set-difficulty`) — e, removendo a entrada da tabela de verdade, `tsc` falha com TS1360. Na CLI e no MCP a ligacao nome→comando e conferida em teste, nao em tipo: comando do `commander` e ferramenta anunciada so existem rodando
- [x] TDD em cada operacao, e suite de contrato para quem implementar o `ITaskManager` — `runTaskManagerContractTests` em `packages/task-manager/src/task-manager.contract.ts`, exportada por `@opentask/taskin-task-manager/testing`; roda contra o `TaskManager` em `task-manager.contract.test.ts` (7 testes)
- [x] Documentacao nas quatro frentes, e atualizar o RDT de proposta para aceita — READMEs de `task-manager`, `task-server-ws` (tabela do protocolo), `task-provider-pinia`; `docs/ARCHITECTURE.md` e `docs/QUICKSTART.md`; o site em `packages/docs/content/index.md` e `pt-br/index.md`; `docs/RDT/superficies-derivam-do-mesmo-contrato.md` com `Status: aceita` e a secao "Como ficou". Changeset em `.changeset/operacoes-nomeadas-no-dashboard.md`

### O que ficou decidido, e onde

- **O quadro continua calculando a mudanca** (com desfazer e refazer, em
  `use-prioritization`); o que mudou e o que vai pelo fio. Por isso o dashboard
  manda `set-priority` com o numero que o quadro calculou, e nao `move-before`:
  reescrever o composable para mover pelo servidor era outra task. `move-before`
  e `move-after` estao no protocolo, testados, para quem quiser.
- **`create-group` no protocolo.** O quadro inventa o id ao agrupar duas
  tarefas, e `assignToGroup` recusa grupo inexistente (como na CLI e no MCP).
  Antes, o `update` gravava o id sem registro, e o `lint` avisava depois. O
  grupo nasce com o nome `Novo grupo` — o registro exige nome e o quadro nao
  pede um.
- **As mensagens sao atendidas uma de cada vez, na ordem.** Em paralelo,
  `assign-to-group` procurava o grupo antes de `create-group` termina-lo — o
  teste de sequencia falha sem a fila (conferido tirando-a).
- **`getStatus().port` devolve a porta aberta**, para `port: 0` servir em teste.
- **`list` passa pelo `ITaskManager.getAllTasks`**, e nao pelo provider.

### Verificacao

`pnpm lint` e `pnpm typecheck` verdes (22/22 e 28/28). `pnpm test`: verdes
`task-manager` (101), `task-server-ws` (35), `task-server-mcp` (76),
`task-provider-pinia` (12), `file-system-provider` (405), `types`, `utils`,
`git-utils`, `ui-sense`; `dashboard` 14/14 rodado direto. `design-vue` falha por
falta do navegador do Playwright (ambiente, nao tocado), e isso impede o turbo de
rodar os dependentes; rodados a mao: `taskin` 415/416 em serie, e o que falha
(`taskin start > should fail if task does not exist`) passa isolado, com e sem
esta mudanca — o flake ja registrado na task-105.

### Para a proxima

- Renomear um grupo no quadro nao chega ao registro (e nao chegava antes).
- `TaskPrioritizationUpdateSchema` em `types-ts` ficou sem uso; nao removido por
  ser export publico e alimentar a geracao de tipos.
- O `taskin dashboard` escuta em `localhost`, que neste ambiente resolve so para
  `::1`; um cliente em `127.0.0.1` nao conecta.

## Notes

### A decisao

Esta task implementa `docs/RDT/superficies-derivam-do-mesmo-contrato.md`, que
registra o raciocinio completo. O resumo:

O `ITaskManager` ja e um contrato de operacoes — `startTask`, `pauseTask`,
`finishTask`, `createTask`, `prioritizeAll` — e a CLI e o MCP sao concretizacoes
dele. O dashboard **nao passa por ali**: ele fala com o servidor WebSocket, cujo
`update` cai direto em `ITaskProvider.updateTask(task)`, uma escrita generica.

Priorizar e agrupar existem so nesse segundo caminho. Nao por esquecimento: elas
nunca foram **nomeadas** como operacoes, e por isso nao ha o que a CLI ou o MCP
pudessem chamar.

### Por que nao basta repetir a correcao caso a caso

As tasks 064, 070 e 105 sao a mesma correcao, uma capacidade por vez — filtro,
ordenacao, agrupamento. Cada uma cola uma superficie atrasada e nenhuma impede a
proxima. O unico mecanismo que ja impediu uma divergencia neste repositorio foi o
portao de compilacao do `FilterCriteriaSchema`, onde esquecer uma superficie nao
compila.

Generalizar esse portao para as operacoes e a metade da task que tem valor
duradouro; renomear as operacoes sozinho so arruma o presente.

### Ordem

A task-105 entrega os comandos da CLI e do MCP e pode ser feita antes — e
provavelmente deve, porque e pequena e o atrito e diario. Feita depois desta,
ela vira quase de graca. Feita antes, o codigo dela migra para as operacoes
nomeadas quando esta chegar. Qualquer ordem serve; fazer as duas e o que importa.

### O que esta task nao faz

Nao obriga toda operacao a existir nas tres superficies. Uma operacao pode nao
fazer sentido em alguma delas — o que nao pode e a ausencia acontecer por
omissao, sem ninguem decidir.

### O que a task-105 ja entregou

A 105 nasceu as operacoes direto no `ITaskManager`, com os nomes daqui:
`assignToGroup`, `removeFromGroup`, `setPriority`, `moveBefore` e `moveAfter`, e
a CLI (`taskin group join/leave`, `taskin priority`) e o MCP (`join_group`,
`leave_group`, `set_priority`) ja as chamam. Os tres primeiros itens do
checklist e a parte de CLI e MCP do sexto estao feitos la — conferir e marcar
com a evidencia, e nao reimplementar.

O que falta e o miolo desta task: o dashboard e o protocolo do servidor
WebSocket passarem a usar as operacoes em vez do `update` generico, o portao de
compilacao, a suite de contrato e a RDT passar de proposta para aceita.
