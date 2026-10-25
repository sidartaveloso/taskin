---
'taskin': minor
'@opentask/taskin-git-utils': minor
'@opentask/taskin-types': patch
---

`taskin start`, `review`, `finish` e o MCP funcionam numa worktree. O commit de status vai para a branch corrente, só com o arquivo da task, sem stash nem `git checkout` da branch padrão. Com `autoSync` e `defaultBranch`, o mesmo status é publicado em `origin/<defaultBranch>`; falha de publicação avisa o motivo e o status fica comitado. Sem remoto `origin`, basta o commit local.

- `@opentask/taskin-git-utils`: `publishTaskStatusChange` devolve `noRemote: true` quando não há `origin`. `commitTaskStatusChangeOnBranch` fica obsoleto: faz stash e checkout, o que falha numa worktree.
- `@opentask/taskin-types`: a documentação de `autoSync` e `defaultBranch` descreve o que passa a acontecer.
