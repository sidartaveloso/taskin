# 🧩 Task 079 — Grupo vira entidade no dominio: Group com id e nome, e a task guarda so o groupId

- Status: in-progress
- Type: feat
- Priority: 258
- Assignee: Sidarta Veloso

## Description
Hoje groupId e groupName sao dois campos soltos repetidos em cada task. Criar a entidade em taskin-types, tirar groupName do Task, e definir no ITaskProvider as operacoes de grupo — incluindo o que um provider sem o conceito devolve.

## Tasks
- [ ] Teste vermelho: o nome de um grupo tem **um** lugar, e renomear nao toca em task nenhuma
- [ ] `Group { id, name }` e `GroupSchema` em `@opentask/taskin-types`
- [ ] `groupName` sai do `Task` — a task guarda so o `groupId`
- [ ] `ITaskProvider` ganha as operacoes de grupo
- [ ] Definir e documentar o que um provider **sem** o conceito devolve
- [ ] Definir o que acontece com os membros quando o grupo e apagado
- [ ] `pnpm lint`, `typecheck`, `test` e `build` verdes

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
