# 🧩 Task 254 — A publicação do status duplica a task renomeada na branch

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Difficulty: 2

## Description

Na 5.3.1, `start`, `review` e `finish` publicam o status em `origin/<defaultBranch>` montando o commit num índice
temporário: o `buildTaskStatusCommit`, em `packages/git-utils/src/git-service.ts`, lê a árvore da `defaultBranch`
(`read-tree`) e acrescenta os arquivos da task como estão no disco da branch, sem tirar nada da base.

Se a branch renomeou o arquivo da task (o `lint --fix` da 5.3.1 renomeia por `git mv` os nomes acima de 50
caracteres), a `defaultBranch` fica com dois arquivos da mesma task, e o `taskin lint` reprova o número repetido. O
mesmo acontece no sentido inverso: uma branch antiga, com o nome velho, publicando depois que a `defaultBranch` recebeu
o nome novo.

Apareceu num repositório que subiu para a 5.3.1: o `lint --fix` renomeou dez arquivos de task, e publicar o status
daquela branch antes do merge duplicaria cada task renomeada na `develop`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste vermelho de integração (git de verdade, remoto bare): base com `TASKS/task-007-nome-longo.md`, branch com o
  arquivo renomeado para `TASKS/task-007-nome.md`; depois do `publishTaskStatusChange`, a `defaultBranch` tem um
  arquivo só da task-007, o da branch
- [ ] Teste vermelho do sentido inverso: a `defaultBranch` recebeu o nome novo e a branch antiga publica com o nome
  velho; a `defaultBranch` fica com um arquivo só, o da branch
- [ ] Correção: no índice temporário, tirar da base os arquivos que casam com `TASKS/task-NNN-*.md` e não estão no
  disco da branch, antes de acrescentar os da branch
- [ ] Sem nenhum arquivo da task no disco da branch, nada sai da base (teste)
- [ ] Decidir, com teste, o mesmo para `TASKS/assets/task-NNN/`
- [ ] Changeset patch para `@opentask/taskin-git-utils` e para o `taskin`
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm test` verdes

## Acceptance criteria

- [ ] Depois de publicar o status numa branch que renomeou o arquivo da task, `git ls-tree origin/<defaultBranch>
  TASKS/` mostra um arquivo só daquela task, com o nome da branch.
- [ ] As outras tasks e os assets da task na `defaultBranch` continuam lá.

## Notes
