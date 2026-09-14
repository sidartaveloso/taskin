# 🧩 Task 079 — Grupo vira entidade no dominio: Group com id e nome, e a task guarda so o groupId

- Status: in-progress
- Type: feat
- Priority: 258
- Assignee: Sidarta Veloso

## Description
Hoje groupId e groupName sao dois campos soltos repetidos em cada task. Criar a entidade em taskin-types, tirar groupName do Task, e definir no ITaskProvider as operacoes de grupo — incluindo o que um provider sem o conceito devolve.

## Tasks
- [x] Teste vermelho: o nome de um grupo tem **um** lugar, e renomear nao toca em task nenhuma
- [x] `Group { id, name }` e `GroupSchema` em `@opentask/taskin-types`
- [x] `groupName` sai do `Task` — a task guarda so o `groupId`
- [x] `ITaskProvider` ganha as operacoes de grupo
- [x] Definir e documentar o que um provider **sem** o conceito devolve
- [x] Definir o que acontece com os membros quando o grupo e apagado
- [x] `pnpm lint`, `typecheck`, `test` e `build` verdes

### O que comprova cada item

| item | prova |
| --- | --- |
| `GroupSchema` | 4 testes em `taskin.schemas.test.ts` — id e nome, e a recusa de vazio nos dois |
| `groupName` fora do `Task` | o campo saiu do `TaskSchema` e do `TaskPrioritizationUpdateSchema`; 14 arquivos acompanharam |
| operacoes de grupo | `IGroupRegistry` + `runGroupRegistryContractTests` — **8 testes de contrato**, provados pela implementacao de arquivos na task-080 |
| renomear nao toca em tarefa | `renomeia sem tocar em tarefa nenhuma`, no contrato, e medido de verdade na 080 |

**As operacoes ficaram em `IGroupRegistry`, e nao dentro de `ITaskProvider`.**
Nem toda fonte tem o conceito: um provider que tenha expoe o registro, um que
nao tenha simplesmente nao expoe. Quem consome descobre pela **ausencia**, em vez
de receber uma operacao que falha — o mesmo erro do `-t sse` do `mcp-server`.

**Apagar tem assinatura, e ela veio pronta.** `deleteGroup(id, { reassignTo })`:
com destino os membros migram, sem destino ficam sem grupo, e a operacao devolve
quantos foram afetados. E o que Redmine (`reassign_to_id`) e Jira
(`moveIssuesTo`) ja oferecem. O unico resultado inaceitavel — tarefa apontando
para grupo inexistente em silencio — nao e alcancavel.

## Notes
Decorre de `decisoes/identidade-de-grupo-de-tasks.md`, **decidido — opcao A**.
O desenho ja esta fechado; esta task o executa no dominio.

**Por que entidade, em uma frase.** O taskin ja tem uma desnormalizacao igual a
essa e ela cobrou: a task grava `Assignee: <nome de exibicao>` em vez do id, o
que custou 52 avisos de lint num repositorio consumidor e um comando de CLI
inteiro (task-055) para limpar. Grupo nao repete esse erro.

**O que o levantamento decidiu.** Redmine (`issue_categories`), GitHub
(milestones) e Jira (components) modelam agrupamento como entidade com id, nome e
CRUD proprios — os tres, nao a maioria. O dominio pode ter o conceito sem inventar
nada.

**A operacao de apagar tem resposta pronta para copiar.** O Redmine aceita
`reassign_to_id` e o Jira aceita `moveIssuesTo` na propria chamada de exclusao.
A decisao a declarar aqui e se o taskin exige o destino, oferece "sem grupo" como
destino, ou recusa apagar grupo com membros. Qualquer uma serve; o que nao serve
e deixar membro apontando para grupo inexistente em silencio.

**O provider que nao tem o conceito.** Um provider do GitHub mapeia para
milestone; um que nao tenha nada equivalente precisa de uma resposta declarada —
lista vazia e as operacoes de escrita recusando, ou a capacidade anunciada e
consultavel. Escolher e parte desta task: e o mesmo problema de "opcao sem
implementacao" que ja mordeu o `-t sse` do `mcp-server`.

**Sem migracao.** Levantados os 20 projetos com taskin nesta maquina: so um
(`nexo`) tem grupo — 4 tasks, e **nenhuma** com `GroupName`. Nao ha nome a
preservar, e o usuario refara o grupo. A linha `GroupName` pode simplesmente
sair do formato.
