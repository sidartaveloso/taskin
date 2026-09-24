# 🧩 Task 106 — As operacoes que faltam viram contrato: assignToGroup, setPriority e moveBefore no ITaskManager

- Status: pending
- Type: refactor
- Assignee: sidartaveloso
- Priority: 42

## Description
Hoje o dashboard escreve pelo update generico do ITaskProvider, enquanto a CLI e o MCP passam pelo ITaskManager. Priorizar e agrupar existem so no primeiro caminho, e por isso existem so no dashboard: nunca foram nomeadas como operacoes, sao efeito colateral de um update. Nomear assignToGroup, removeFromGroup, setPriority, moveBefore e moveAfter no ITaskManager e fazer o dashboard usa-las, de modo que a CLI e o MCP ganhem as operacoes sem trabalho proprio e o update generico deixe de ser a porta dos fundos. Em seguida generalizar o portao de compilacao que o FilterCriteriaSchema ja tem para os criterios, agora para as operacoes. Ver docs/RDT/superficies-derivam-do-mesmo-contrato.md.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `assignToGroup(taskId, groupId)` e `removeFromGroup(taskId)` no `ITaskManager`
- [ ] `setPriority(taskId, priority)`
- [ ] `moveBefore(taskId, targetId)` e `moveAfter(taskId, targetId)`, reaproveitando a numeracao por passos da task-084
- [ ] O dashboard passa a usar as operacoes nomeadas no lugar do `update` generico
- [ ] O protocolo do servidor WebSocket carrega as operacoes, e nao a task inteira para gravar
- [ ] A CLI e o MCP expoem as operacoes (e o que a task-105 entrega, agora sem caminho proprio)
- [ ] Portao de compilacao: acrescentar operacao e esquecer uma superficie precisa **nao compilar**
- [ ] TDD em cada operacao, e suite de contrato para quem implementar o `ITaskManager`
- [ ] Documentacao nas quatro frentes, e atualizar o RDT de proposta para aceita

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
