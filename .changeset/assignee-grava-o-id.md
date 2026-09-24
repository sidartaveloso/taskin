---
'@opentask/taskin-file-system-provider': patch
'taskin': patch
---

O `Assignee:` passa a guardar o id do registro, e não o nome de exibição.

`taskin new -u <id>` gravava o nome de exibição do usuário, e o `taskin lint` não
acusava, porque a resolução também casa pelo nome. Agora o `createTask` grava o
id (recebendo o id ou o nome); quem não está no registro fica como foi digitado.
O `taskin lint` avisa quando o `Assignee:` é o nome de exibição, e o
`taskin lint --fix` o reescreve para o id. A leitura continua aceitando o nome,
para que arquivos antigos sigam resolvendo até o `--fix` rodar.
