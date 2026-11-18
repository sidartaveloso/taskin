# 🧩 Task 254 — A publicação do status duplica a task renomeada na branch

- Status: done
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
- [x] Teste vermelho de integração (git de verdade, remoto bare): base com `TASKS/task-007-nome-longo.md`, branch com o
  arquivo renomeado para `TASKS/task-007-nome.md`; depois do `publishTaskStatusChange`, a `defaultBranch` tem um
  arquivo só da task-007, o da branch. Prova: "a branch que renomeou o arquivo da task publica um arquivo so, com o
  nome dela" e "o commit publicado so mexe nos dois nomes da task; as outras tasks ficam", em
  `packages/git-utils/src/git-service.publish-status.renamed-task.integration.test.ts`
- [x] Teste vermelho do sentido inverso: a `defaultBranch` recebeu o nome novo e a branch antiga publica com o nome
  velho; a `defaultBranch` fica com um arquivo só, o da branch. Prova: "a branch antiga, com o nome velho, publica
  depois que a defaultBranch recebeu o nome novo"
- [x] Correção: no índice temporário, sai da base o nome da task que o disco da branch não tem, antes de os arquivos da
  branch entrarem. Prova: `dropOtherNamesOfTask`, em `packages/git-utils/src/git-service.ts`
- [x] Sai só o nome que a branch conheceu: uma task de mesmo número criada na base depois que a branch saiu dela fica
  (ver Notes). Prova: "outra task com o mesmo numero, criada na defaultBranch depois que a branch saiu dela, continua
  la"; com a regra sem esse filtro, só esse teste fica vermelho
- [x] A duplicata que uma publicação da 5.3.1 já deixou na base se desfaz na próxima publicação. Prova: "a duplicata
  que uma publicacao anterior deixou na defaultBranch se desfaz"
- [x] Sem nenhum arquivo da task no disco da branch, nada sai da base. Prova: "sem nenhum arquivo da task no disco da
  branch, nada sai da defaultBranch"
- [x] Decidido para `TASKS/assets/task-NNN/`: continua só acrescentando (ver Notes). Prova: "os assets da task que a
  defaultBranch tem e a branch nao continuam publicados"
- [x] Changeset patch para `@opentask/taskin-git-utils` e para o `taskin`: `.changeset/status-publicado-de-task-renomeada.md`
- [x] `pnpm lint`, `pnpm typecheck` e `pnpm test` verdes: 48 de 48 tarefas do turbo no `pnpm test` (179 testes no
  `git-utils`, 13 arquivos) e 137 testes em `test:dev-scripts`; o `pnpm lint` sai com 0 e 3 avisos, todos em pacotes
  que esta task não toca (`taskin` e `taskin-situation`)

## Acceptance criteria

- [x] Depois de publicar o status numa branch que renomeou o arquivo da task, `git ls-tree origin/<defaultBranch>
  TASKS/` mostra um arquivo só daquela task, com o nome da branch. Prova: os testes acima e a prova de ponta a ponta
  em Resultado.
- [x] As outras tasks e os assets da task na `defaultBranch` continuam lá. Prova: "o commit publicado so mexe nos dois
  nomes da task; as outras tasks ficam" e o teste dos assets.

## Notes

**Por que não tirar todo `task-NNN-*.md` que a branch não tem.** Seria a regra mais curta, mas apagaria da branch
padrão outra task com o mesmo número, criada lá depois que a branch saiu dela (número repetido entre worktrees e
máquinas acontece; ver task-251). Hoje essa colisão vira duas tasks com o mesmo número e o `taskin lint` acusa; com a
regra curta, a outra task sumiria do quadro sem aviso. Por isso o nome só sai da base se ele já estava no ponto em que
a branch saiu (`git merge-base HEAD origin/<defaultBranch>`) ou se a base o criou renomeando um nome de lá
(`git diff-tree --find-renames --diff-filter=A`: o que aparece como acrescentado é outra task). Sem ponto em comum
(clone raso, históricos sem relação), nada sai, como antes.

**Assets.** `TASKS/assets/task-NNN/` tem o número no nome da pasta, e o renome do arquivo da task não mexe nela: não
há duplicata a desfazer. Tirar da base o que a branch não tem apagaria evidência publicada por outra branch, ou chegada
na branch padrão depois que esta saiu. Um asset que a branch apagou de propósito continua na base até o merge.

**Sentido inverso.** A branch antiga publica com o nome velho, e a branch padrão volta para o nome velho até essa branch
entrar. É o que a branch vê; o merge depois é limpo (os dois lados com o mesmo nome), e o `lint --fix` renomeia de novo.

## Resultado

**O que mudou.** O `buildTaskStatusCommit` lista os arquivos da task no disco antes de montar o índice. Depois do
`read-tree` da base, o `dropOtherNamesOfTask` tira do índice (`update-index --index-info`, modo 0) o nome da task que a
base tem e o disco não tem, salvo o que a base criou depois do ponto em que a branch saiu dela. Os arquivos da branch
entram em seguida, como antes. Os assets continuam só acrescentando.

**Testes.** Sete casos em `git-service.publish-status.renamed-task.integration.test.ts`, com git de verdade, worktree e
remoto bare. Antes da correção, quatro vermelhos (os dois sentidos do renome, o commit com os dois nomes e o dos assets,
que também confere o nome da task); o da guarda sem arquivo no disco já passava. Os casos da duplicata deixada pela 5.3.1
e da colisão de número entraram com a correção. Os 9 casos de `git-service.publish-status.integration.test.ts` seguem
verdes.

**Prova de ponta a ponta.** Com a CLI deste checkout: um repositório com remoto bare, `autoSync` ligado e
`defaultBranch` `develop`; a task-001 com nome de 83 caracteres na `develop`; uma worktree em `fix/task-001` roda
`taskin lint --fix` (renomeia por `git mv`) e `taskin start 1` (publica em `origin/develop`). Depois, `git ls-tree` da
`develop` do remoto e `taskin lint` num clone dela:

```text
develop (antes):
  TASKS/task-001-um-titulo-bem-comprido-que-passa-do-limite-de-cinquenta-caracteres-no-nome.md
  TASKS/task-001-um-titulo-bem-comprido-que-passa-do-limite-de.md
  taskin lint: "Task number 001 is used by 2 files", sai com 1

fix/task-254 (depois):
  TASKS/task-001-um-titulo-bem-comprido-que-passa-do-limite-de.md
  taskin lint: nenhum erro, sai com 0
```

O "antes" usa o `git-service.ts` da `develop`, compilado no lugar; o mesmo roteiro, com o `dist` da correção, dá o
"depois".
