---
'@opentask/taskin-task-server-mcp': patch
'taskin': patch
---

`@modelcontextprotocol/sdk` sobe de `^1.6.0` para `^1.30.0`.

Resolvia 1.25.3. A faixa antiga já permitiria versões novas, mas nada obrigava
a atualização — e o SDK carrega `@hono/node-server` e um `express` próprio, que
são caminho de runtime de quem instala o `taskin` e o servidor MCP.

Diferente de um `override` no workspace, que só vale para a árvore deste
repositório, uma dependência declarada viaja com o pacote: esta é das poucas
correções do `pnpm audit` que alcança quem consome.
