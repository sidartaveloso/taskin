---
'@opentask/taskin-file-system-provider': minor
'taskin': minor
---

**Número de task repetido.** Dois arquivos com o mesmo número em `TASKS/`
(`task-027-a.md` e `task-027-b.md`) passam a ser **erro** no `taskin lint`, com
os caminhos dos dois. O `start`, o `review`, o `finish` e o `pause` recusam o
número repetido com a mesma mensagem, em vez de agir sobre um dos arquivos.

O `taskin lint --fix` renumera todos menos o mais antigo para o próximo número
livre — nome do arquivo (por `git mv` quando versionado), título e uma nota no
fim dizendo qual era o número. Fica com o número o arquivo criado primeiro
(data do commit que o criou, atravessando renomes; sem histórico, a data do
arquivo; no empate, o que não está `done`). Os links ao arquivo renomeado são
ajustados em todo arquivo versionado do repositório, inclusive por caminho
relativo. Menções soltas como `task-027` e as branches `*/task-027*` só são
listadas, para alguém decidir.

- `@opentask/taskin-file-system-provider`: `findTask` lança quando o número é
  repetido, em vez de devolver o primeiro arquivo que o `readdir` listar.
