---
'@opentask/taskin-git-utils': patch
'taskin': patch
---

O status publicado de uma task cujo arquivo tem outro nome na branch não deixa
mais a task em dobro na branch padrão. Até aqui, `taskin start`, `review` e
`finish` acrescentavam em `origin/<defaultBranch>` o arquivo da task com o nome
da branch e mantinham o nome antigo; depois de um `taskin lint --fix` que
renomeou nomes longos, a branch padrão ficava com dois arquivos do mesmo número
e o `taskin lint` reprovava. Agora o nome que a branch padrão tem e a branch
não tem sai no mesmo commit de status, nos dois sentidos: a branch que renomeou
e a branch antiga que publica depois que a branch padrão recebeu o nome novo.

Sai só o nome que a branch conheceu. Uma task de mesmo número criada na branch
padrão depois que a branch saiu dela é outra task e fica, e os arquivos em
`TASKS/assets/task-NNN/` que a branch não tem também ficam.

- `@opentask/taskin-git-utils`: `publishTaskStatusChange` tira do commit os
  nomes antigos da task.
