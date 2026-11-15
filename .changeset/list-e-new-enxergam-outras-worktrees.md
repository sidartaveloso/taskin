---
'@opentask/taskin-git-utils': minor
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': minor
'taskin': minor
---

O `list` e o `new` enxergam as tasks das outras worktrees e da branch padrão, sem rede fora do autoSync (task-251).

- `@opentask/taskin-git-utils`: `listLocalTaskSources({ cwd, tasksDirectory, defaultBranch?, fetch? })` lê a pasta de tasks das outras worktrees locais (inclusive arquivo não commitado) e as refs locais `<defaultBranch>` e `origin/<defaultBranch>`, em ordem de precedência. Só faz `git fetch` com `fetch: true`; uma falha vira aviso.
- `@opentask/taskin-task-manager`: `CreateTaskOptions.reservedTaskIds`, opcional, com os ids já usados fora do que o provider lê.
- `@opentask/taskin-file-system-provider`: `createTask` numera depois dos `reservedTaskIds`; `parseTaskFile(fileName, content)` e `getTasksDirectory()` expõem a leitura de uma task com as mesmas regras do `getAllTasks`.
- `taskin`: `list` acrescenta as tasks que só existem em outra fonte, com a origem (`source` no `--json`), e avisa quando o status diverge ou um número é de dois arquivos; `new` numera pelo maior id entre todas as fontes. Com `autoSync` e `defaultBranch`, o `list` faz `fetch` antes.
