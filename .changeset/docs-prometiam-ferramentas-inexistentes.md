---
'@opentask/taskin-task-server-mcp': patch
---

A documentação do servidor MCP deixa de anunciar ferramentas que não existem.

Três documentos listavam **seis** ferramentas; o servidor tem **três**.
`get_task`, `pause_task` e `lint_tasks` nunca existiram, e `list_tasks` era
documentada desde antes de ser implementada. A documentação andou à frente do
código por tempo indeterminado, e nada comparava as duas listas.

Corrigidos `docs/MCP_CLAUDE_SETUP.md`, `docs/MCP_VSCODE_SETUP.md` e o README do
pacote — as três que existem ficam anunciadas, e as três que não existem viram
uma nota dizendo o que usar no lugar (`taskin pause`, `taskin lint`).

Os recursos também: a lista prometia `task://{taskId}` e
`tasks://status/{status}`; o que existe é `taskin://tasks`.

## A guarda

Entra um teste que lê esses três arquivos e compara o que eles **anunciam** —
título, linha de tabela, item de lista — com o `listTools()` do servidor. Nos
dois sentidos: nada documentado sem existir, nada implementado sem documentar.
