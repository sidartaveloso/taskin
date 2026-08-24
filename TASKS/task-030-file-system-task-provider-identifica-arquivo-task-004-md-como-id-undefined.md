# Task 030 — file-system-task-provider identifica arquivo task-004.md como id undefined

Status: done
Type: fix
Assignee: A definir

## Description

crie uma tas com nome task-004.md e acione o pnpm taskin ls, a task será listada com id undefined.

## Tasks

- [x] Extrair o id numérico de arquivos sem slug de título: `task-004.md` → `004` (antes caía em `unknown`/`undefined`)
- [x] `findTask` passa a localizar arquivos `task-004.md` (antes só `task-004-*.md`)
- [x] Alinhar padrões de nome de arquivo no `task-validator`, `file-system-task-linter` e `file-system-metrics-adapter` para aceitar `task-NNN.md`
- [x] Testes unitários cobrindo `getAllTasks` e `findTask` com arquivo `task-004.md`

## Notes

- A causa raiz era a suposição de que todo arquivo de task segue `task-NNN-slug.md`. Arquivos criados manualmente apenas com o id (`task-004.md`) não casavam com `/^task-(\d+)-/`, resultando em id `unknown`/`undefined` no `ls`.
- Fix centralizado em `extractTaskIdFromFileName()` no `file-system-task-provider` (`/^task-(\d+)(?:-.+)?\.md$/`), reutilizado em `findTask` e `getAllTasks`.
- `pnpm taskin ls` com `task-004.md` agora lista `ID: 004` e `taskin lint` valida o arquivo sem warnings de nome.
