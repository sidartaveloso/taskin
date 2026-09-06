---
'@opentask/taskin-git-utils': major
---

Abre as primitivas de sincronização no `IGitService` e corrige o diff de arquivo
único.

O auto-sync da CLI (push/pull/squash) e o commit em ramo configurado precisavam
de operações que o `IGitService` não expunha. Elas existiam soltas, então o
provider de arquivos falava com o git por fora do contrato.

## API nova

`IGitService` ganhou `fetch`, `rebase`, `push`, `abortRebase` e `checkoutFile`,
e `commitTaskStatusChangeOnBranch` ganhou o parâmetro opcional `defaultBranch` —
com ele, o commit de status vai para o ramo configurado e volta para o ramo
original, preservando as mudanças locais.

## Correção

`getSingleFileDiff` devolvia um objeto com `path: undefined` quando a linha de
numstat tinha menos de três campos, em vez de `null`. Não era crash: era dado
silenciosamente errado descendo para as métricas. Agora retorna `null`, como o
caso de arquivo binário já fazia.

`parseCommits` e `getBlame` foram reescritos para não indexar às cegas a saída
do git. Mesmo comportamento, sem depender de o comando externo devolver sempre a
forma esperada.

## Breaking change

Quem **implementa** `IGitService` precisa adicionar os cinco métodos novos. Quem
apenas usa o `GitService` não muda nada — todas as adições são retrocompatíveis
no uso.

O `major` segue o mesmo critério do `pauseTask` em `ITaskManager`: o pacote está
em 2.x, então quebra de contrato para implementadores é major. Se `IGitService`
for considerado interno, isto pode virar `minor`.
