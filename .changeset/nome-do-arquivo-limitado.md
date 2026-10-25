---
'@opentask/taskin-utils': minor
'@opentask/taskin-file-system-provider': patch
'taskin': patch
---

O nome do arquivo de uma task nova leva só o começo do título: até 50
caracteres depois do `task-NNN-`, cortados numa fronteira de palavra. O título
completo continua no arquivo. O número, único, garante que dois títulos iguais
— ou que só diferem depois do corte — nunca geram o mesmo nome. Um título sem
letra nem dígito gera `task-NNN.md`; antes gerava `task-NNN-.md` e o
`taskin new` falhava ao ler o próprio arquivo.

- `@opentask/taskin-utils`: `slugify(text, { maxLength })`.
- `@opentask/taskin-file-system-provider`: `TASK_FILE_SLUG_MAX_LENGTH`.
