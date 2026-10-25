---
'@opentask/taskin-git-utils': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': minor
'taskin': minor
---

O status de uma task tem a branch padrão do remoto como quadro compartilhado.

- `@opentask/taskin-git-utils`: `detectDefaultBranch(cwd)` escolhe `develop`, senão `main`, senão `master`, olhando as refs locais e as de `origin/*`, sem rede, e devolve `null` em vez de adivinhar. `GitService.publishTaskStatusChange(taskId, status, defaultBranch)` publica só o arquivo da task (e `TASKS/assets/task-<id>/`) em `origin/<defaultBranch>`, sem trocar de branch, sem stash e sem tocar no índice nem na árvore; funciona numa worktree com a branch padrão aberta em outro checkout.
- `@opentask/taskin-task-manager`: `ITaskProvider.describePublish`, opcional, diz como publicar só uma task.
- `@opentask/taskin-file-system-provider`: `describePublish` devolve os caminhos da task e o comando `git add`/`git commit` restrito a eles.
- `taskin`: `taskin config --level autopilot` detecta e grava `automation.defaultBranch`; o menu interativo a pergunta; `--default-branch <branch>` grava e o `--show` mostra. Em autopilot sem o campo, a detecção vale em memória. Fora do autopilot, `start` e `finish` ensinam a publicar só a task, no lugar do `git add TASKS/… && git commit` sem pathspec.
