# 🧩 Task 114 — Levar uma task ao topo ou ao fim pela CLI e pelo MCP

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1030

## Description
O dashboard ganhou os botoes de topo e fim na task-101, mas a CLI e o MCP so tem numero absoluto e --before/--after, que pedem um alvo. Levar uma task ao topo ou ao fim e a operacao mais rotineira de priorizacao e precisa de atalho nas tres superficies: moveToTop e moveToBottom como operacoes nomeadas do ITaskManager, --top/--bottom no taskin priority, e o mesmo no set_priority do MCP. O dashboard passa a usar as mesmas operacoes.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `moveToTop(taskId)` e `moveToBottom(taskId)` como operacoes nomeadas do `ITaskManager`, ao lado de `moveBefore`/`moveAfter` — `packages/task-manager/src/task-manager.types.ts` e `task-manager.ts` (devolvem `{ task, changed }`, como `moveBefore`). A regra e pura, em `posicionarNoExtremo` (`packages/task-manager/src/posicionar-prioridade/`): calcula a referencia e delega a `posicionarPrioridade`, sem numeracao nova. Testes: `posicionarNoExtremo` (10) em `posicionar-prioridade.test.ts`, `TaskManager — topo e fim` (5) em `task-manager.agrupar-priorizar.test.ts`, e dois casos novos na suite de contrato `runTaskManagerContractTests` (`moveToTop e moveToBottom levam a tarefa aos extremos da fila`, `... de uma agrupada ficam dentro do grupo`)
- [x] Mesma semantica do dashboard (task-101): uma task agrupada vai ao topo ou ao fim **do proprio grupo** — testes `agrupada vai ao topo do proprio grupo, e nao da fila inteira`, `agrupada vai ao fim do proprio grupo ...`, `solta vai a frente de um grupo que abre a fila, e para depois de um que a fecha`. **Decidido: o grupo inteiro nao ganha a operacao na CLI nem no MCP** — ver "O que ficou decidido"
- [x] `taskin priority <task> --top` e `--bottom`, exclusivos com o numero, `--before` e `--after` — `packages/cli/src/commands/priority.ts`; e2e em `packages/cli/src/commands/group-priority.e2e.test.ts`: `com --top, leva a tarefa a frente da fila e muda um arquivo so`, `com --bottom, numera a cauda sem numero e diz quantos arquivos gravou`, `--top ja no topo nao grava nada, e diz`, `--top e --bottom sao formas: nao combinam com outra`
- [x] O mesmo no `set_priority` do MCP — `top: true` / `bottom: true` em `packages/task-server-mcp/src/task-server-mcp.ts`; `top: false` conta como ausente, e um valor que nao seja booleano e recusado. Testes em `packages/task-server-mcp/src/agrupar-priorizar.test.ts`: `set_priority com top ...`, `set_priority com bottom numera a cauda ...`, `top e bottom contam como forma ...`, `top ou bottom que nao seja true e recusado, sem gravar`
- [ ] O dashboard passa a chamar as mesmas operacoes, em vez da logica propria do `usePrioritization` — **nao feito**. O caminho esta pronto: o servidor WebSocket atende `move-to-top` e `move-to-bottom` (testes `move-to-top leva a tarefa a frente da fila, sem referencia` e `move-to-bottom leva a tarefa ao fim, numerando a cauda sem numero` em `packages/task-server-ws/src/task-server-ws.operacoes.test.ts`), e `OperacaoDoQuadro` no store Pinia ja os tipa. O que falta e o quadro mandar a operacao em vez de calcular o numero, e isso esbarra em duas coisas que pedem decisao: (1) o topo do quadro e o da lista **visivel** (depois do filtro, task-101) e o do dominio e o da fila inteira — com filtro ativo os dois nao coincidem; (2) o quadro desfaz e refaz sobre o estado local, e mandar a operacao pelo fio exige que o desfazer vire outra operacao. E a mesma decisao que a 106 tomou para `move-before` ("reescrever o composable para mover pelo servidor era outra task")
- [x] Custo: topo grava 1 arquivo; fim de uma cauda sem `Priority` numera a cauda — medido nos testes: `topo fica a frente da primeira da fila e grava um arquivo so`, e `fim de uma cauda sem numero numera a cauda: 3 arquivos, e depois 1` (o cenario das notas: 1 e 2 numeradas, 3 e 4 sem, levar a 1 ao fim grava 3, 4 e 1; o movimento seguinte custa 1). As tres superficies dizem quanto gravaram: a CLI imprime `N task file(s) written` (ou `already at the top ... no task file written`), o MCP devolve `changed`, e o WebSocket reenvia a lista inteira (`tasks`), porque a cauda pode ter sido numerada
- [x] Entrar no portao de compilacao da 106 — acrescentar as duas operacoes ao `ITaskManager` fez `tsc` falhar com TS1360 em `superficies-das-operacoes.ts` (`missing ... moveToTop, moveToBottom`) ate a tabela ganhar as entradas, e o servidor WebSocket falhar com TS2739 (`missing "move-to-top", "move-to-bottom"`) ate ganhar os handlers. Entradas: `cli: priority`, `mcp: set_priority`, `ws: move-to-top` / `move-to-bottom`. `register.superficies.test.ts` (CLI) e `superficies.test.ts` (MCP) conferem os nomes e passam
- [x] TDD, e documentacao nas quatro frentes — cada teste acima foi escrito e visto falhar antes da implementacao. Docs: `README.md` (raiz), `packages/cli/README.md` (formas e custo), `docs/QUICKSTART.md`, `docs/MCP_CLAUDE_SETUP.md`, `docs/MCP_VSCODE_SETUP.md`, `docs/ARCHITECTURE.md`, `docs/RDT/superficies-derivam-do-mesmo-contrato.md`, o site em `packages/docs/content/index.md` e `pt-br/index.md`; e `packages/task-manager/README.md`, `packages/task-server-mcp/README.md`, `packages/task-server-ws/README.md` (tabela do protocolo). Changeset em `.changeset/topo-e-fim-pela-cli-e-pelo-mcp.md`
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` — ver "Verificacao" abaixo

### O que ficou decidido, e onde

- **Topo e fim sao um `moveBefore`/`moveAfter` cuja referencia a operacao
  descobre.** `posicionarNoExtremo` so escolhe a referencia — a primeira ou a
  ultima irma na ordem manual — e passa a `posicionarPrioridade`. Nao ha regra
  de numeracao nova, e o custo e o que a 105 ja media.
- **Irmas.** Agrupada: os membros do proprio grupo. Solta: a fila inteira,
  grupos inclusive — o grupo ocupa o lugar do primeiro membro, entao passar do
  primeiro (ou do ultimo) numero de todos e passar de todo no de fora.
- **O grupo inteiro nao ganha topo e fim na CLI nem no MCP.** Nao existe
  operacao de grupo no `ITaskManager` — mover um grupo e mover um bloco de
  membros, que `posicionarPrioridade` nao expressa, e o portao exigiria uma
  operacao nova com as tres superficies. Ninguem pediu pela CLI; o dashboard tem
  os botoes do grupo (task-101). Fica para quando alguem pedir.
- **Ja no extremo nao grava nada**: `changed: 0`, e a CLI diz `already at the
  top`.
- **Mensagem da CLI com grupo**: `now at the top of group g-cli`, para ninguem
  achar que a tarefa foi ao topo da fila inteira.

### Verificacao

`pnpm format` e `pnpm lint` verdes. `pnpm typecheck` verde (28/28) — depois de
rebuildar `packages/ui-sense`, cujo `dist` estava sem declaracoes de tipo
(ambiente, nao tocado). `pnpm test`: verdes `task-manager` (118),
`task-server-ws` (30), `task-server-mcp` (84), `task-provider-pinia` (12),
`file-system-provider` (405), `types`, `utils`, `git-utils`; `dashboard` 14/14
rodado direto; `design-vue` 283/283 em jsdom (`--browser.enabled=false
--environment=jsdom`). A suite de navegador de `design-vue` e `ui-sense` nao
roda aqui (sem o Chromium do Playwright), e isso faz o turbo marcar os
dependentes como falhos. `taskin` em serie: 419/420; o que falha
(`the CI skip tag in the commands > should mark the auto-committed status change
with the configured tag`) passa isolado com esta mudanca e falha isolado sem
ela — o flake de git do ambiente ja registrado na 105/106.

### Para a proxima

- O dashboard chamar `move-to-top`/`move-to-bottom` pelo fio (item em aberto
  acima): decidir topo da lista visivel versus da fila, e como o desfazer volta.
- Topo e fim de um grupo inteiro pela CLI e pelo MCP, se alguem pedir.

## Notes

### Por que

A task-101 deu ao dashboard os botoes de topo e fim. A CLI e o MCP ficaram com
numero absoluto e `--before`/`--after`, que exigem saber o alvo — para levar ao
topo e preciso antes descobrir qual e a primeira task da fila. E a operacao mais
rotineira da priorizacao, e o pedido foi explicito: precisa de atalho.

### Direcao da fila

Na ordem manual o **menor** numero fica no topo (`ordenarTarefas`, modo
`manual`). Topo e, portanto, um numero menor que o do primeiro; fim, maior que o
do ultimo numerado.

### O custo do fim

Tarefa sem `Priority` sempre ordena depois das numeradas. Levar uma tarefa ao
fim quando ha cauda sem numero obriga a numerar a cauda: com 4 tarefas, 1 e 2
numeradas e 3 e 4 sem, levar a 1 ao fim grava **3** arquivos (3, 4 e 1). No
cenario da 082, com 480 sem numero, sao 481. O custo e de uma vez so: depois
disso a cauda esta numerada e o proximo movimento custa 1. A CLI deve dizer
quantos arquivos gravou, para que isso nao aconteca em silencio.

### Ordem

Depois da 106. Feita antes, as operacoes nascem num contrato que ainda nao tem
o portao; feita depois, elas entram nele e as tres superficies derivam delas.
