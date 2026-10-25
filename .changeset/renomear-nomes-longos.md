---
'@opentask/taskin-file-system-provider': minor
'taskin': patch
---

O `taskin lint` avisa o arquivo de task cujo nome passa do limite da task-139,
e o `taskin lint --fix` o renomeia para o nome que o `taskin new` daria — mesmo
número, começo do título lido do cabeçalho. O renome vai por `git mv` quando o
arquivo está versionado, e o histórico atravessa (`git log --follow`); sem Git,
ou com o arquivo fora do índice, vai por rename comum. As referências ao nome
antigo dentro de `TASKS/` são reescritas, com e sem `.md`. Se o nome novo já
existe, o `--fix` recusa e não mexe em nenhum dos dois.

- `@opentask/taskin-file-system-provider`: `TASK_FILE_SLUG_MAX_LENGTH` passa a
  viver em `task-file-name`, com `nomeDoArquivoDaTask`, a regra única de quem
  cria e de quem renomeia.
