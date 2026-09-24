# As três superfícies derivam do mesmo contrato

- Status: aceita (implementada na task-106, em 2026-09-24)
- Data: 2026-09-22
- Tasks: 105 (primeiro passo), 106 (a refatoração)

## O que motivou

A pergunta foi direta: CLI, MCP e dashboard não deveriam implementar o mesmo
contrato, já que são apenas concretizações diferentes de acesso?

Deveriam. Em parte já implementam — e é exatamente na parte que falta que a
assimetria nasce, de forma repetida e previsível.

## O que já é compartilhado

**O `ITaskManager` é um contrato de operações de verdade**: `createTask`,
`startTask`, `pauseTask`, `reviewTask`, `finishTask`, `lint`, `prioritizeAll`,
`getAllTasks`, mais o `groupRegistry` opcional. A CLI e o servidor MCP são
concretizações dele.

**As regras puras vivem no `task-manager`** e são consumidas, não copiadas:
`filterTasks`, `ordenarTarefas`, `agruparTarefas`, `numerarPrioridade`. Isso não
foi assim desde o começo — o dashboard mantinha cópias byte a byte dos conjuntos
de filtro e da ordenação manual, e a correção foi consumir o pacote de domínio.

**Um caso tem portão de compilação**: o `FilterCriteriaSchema`. As flags da CLI
e o JSON Schema do `list_tasks` **derivam** dele, e o
`satisfies Record<keyof TaskFilterCriteria, CriterionSurface>` faz com que
acrescentar um critério e esquecer uma superfície não compile.

## Onde o contrato acaba

**O dashboard não passa pelo `ITaskManager`.** Ele fala com o servidor
WebSocket, cujo protocolo aceita `list`, `find`, `update`, `start`, `finish` e
`pause`. Esse `update` cai direto em `ITaskProvider.updateTask(task)` — uma
escrita genérica de "grave esta task assim".

São, portanto, **dois contratos em níveis diferentes**:

| contrato | vocabulário | quem usa |
| --- | --- | --- |
| `ITaskManager` | operações de domínio nomeadas | CLI, MCP |
| `ITaskProvider.updateTask` | escrita genérica de uma task | dashboard, via WebSocket |

Priorizar e agrupar existem apenas no segundo. Não porque alguém esqueceu, mas
porque **nunca foram nomeadas como operações**: são efeito colateral de um
`update` genérico. É por isso que o dashboard faz as duas coisas e a CLI e o MCP
não.

## A evidência de que lembrar não funciona

Três tasks distintas são a mesma correção, uma capacidade por vez:

- **064** — o filtro de tarefas em andamento chegou ao dashboard e faltava nas
  outras duas;
- **070** — a ordenação existia no dashboard e o `list` devolvia o que o
  provider encontrasse;
- **105** — agrupar e priorizar existem só no dashboard.

Cada uma cola uma superfície que ficou para trás, e nenhuma impede a próxima. O
único mecanismo que impediu uma divergência até hoje foi o portão de compilação
dos critérios de filtro.

## A decisão

**Nomear as operações que faltam no `ITaskManager` e fazer o dashboard usá-las**,
em vez do `update` genérico. Em inglês, como as que já existem:

- `assignToGroup(taskId, groupId)` e `removeFromGroup(taskId)`
- `setPriority(taskId, priority)`
- `moveBefore(taskId, targetId)` e `moveAfter(taskId, targetId)`

Duas consequências, e a segunda é a que importa mais:

1. A CLI e o MCP ganham as operações sem trabalho próprio.
2. O `update` genérico deixa de ser a porta dos fundos por onde uma capacidade
   entra sem passar pelo domínio.

**E generalizar o portão.** O que o `FilterCriteriaSchema` faz com critérios —
derivar as superfícies de uma definição e quebrar a compilação quando uma fica
para trás — vale para as operações. Enquanto a ligação depender de alguém
lembrar, ela vai falhar de novo; três tasks já provaram isso.

## O que esta decisão não diz

Não diz que as três superfícies devem **expor tudo**. Uma operação pode não
fazer sentido em alguma delas, e isso continua sendo uma decisão a declarar — o
que não pode é a ausência acontecer por omissão.

Também não diz que o protocolo WebSocket desaparece. Ele continua sendo o
transporte do dashboard; o que muda é que as mensagens passam a carregar
operações nomeadas em vez de uma task inteira para gravar.

## Como ficou

- **As operações.** `assignToGroup`, `removeFromGroup`, `setPriority`,
  `moveBefore` e `moveAfter` nasceram na task-105; a 106 acrescentou
  `setDifficulty`, porque pontuar também só existia pelo `update` genérico.
- **O dashboard.** O quadro de priorização continua calculando a mudança, com
  desfazer e refazer; `operacoesDaMudanca` (`packages/dashboard/src/`) a traduz
  em operações nomeadas, e o store Pinia as manda por `operar()`. O
  `updateTask` do store recusa sempre.
- **O protocolo WebSocket.** Não existe mais `update`. As mensagens são
  `set-priority`, `set-difficulty`, `assign-to-group`, `remove-from-group`,
  `move-before`, `move-after` — mais `create-group`, porque o quadro inventa o
  id ao agrupar duas tarefas e `assign-to-group` recusa grupo inexistente, como
  na CLI e no MCP. As mensagens passaram a ser atendidas uma de cada vez, na
  ordem de chegada; em paralelo, o `assign-to-group` procurava o grupo antes de
  o `create-group` terminar.
- **O portão.** `SUPERFICIES_DAS_OPERACOES` (`packages/task-manager/src/
  superficies-das-operacoes/`) declara, para cada operação do `ITaskManager`,
  como cada superfície a expõe — pelo nome, ou ausente com o motivo. O
  `satisfies Record<OperacaoDoManager, …>` faz operação nova sem as três
  decisões não compilar. O servidor WebSocket tipa os handlers por
  `NomeNaSuperficie<'ws'>`: esquecer um não compila. A CLI e o MCP são
  conferidos em teste (`register.superficies.test.ts`, `superficies.test.ts`),
  porque comando do `commander` e ferramenta anunciada só existem rodando.
- **O contrato.** `runTaskManagerContractTests`, em
  `@opentask/taskin-task-manager/testing`, para quem implementar o
  `ITaskManager`.

### O que ficou de fora, declarado

- `setDifficulty` não tem CLI nem MCP — ausência escrita na tabela, com o
  motivo. Se alguém pedir, é acrescentar o nome e o teste de superfície cobra.
- Renomear um grupo no quadro ainda não chega ao registro: o grupo nasce como
  "Novo grupo", e o nome se troca por `taskin group rename`. O registro de
  grupos (`IGroupRegistry`) é um sub-contrato e fica fora do portão.
