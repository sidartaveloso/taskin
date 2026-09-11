---
'@opentask/taskin-task-server-mcp': patch
'taskin': patch
---

Dependências de runtime sobem para as versões sem alerta conhecido:
`@modelcontextprotocol/sdk` de `^1.6.0` (resolvia 1.25.3) para `^1.30.0`, e
`express` de `^4.21.2` para `^5.2.1`.

Com as duas no lugar, os transitivos passam a resolver sozinhos nas versões
corrigidas — `hono` 4.13.7, `@hono/node-server` 2.1.1, `fast-uri` 3.1.7,
`path-to-regexp` 8.4.2, `body-parser` 2.3.0 e `qs` 6.16.0 — e o `pnpm audit`
deixa de apontar qualquer coisa no caminho de runtime dos pacotes publicados.

O caminho curto seria `overrides` no workspace, e ele **não funcionaria para
quem instala**: override vale só para a árvore do repositório que o declara.
Quem consome o `taskin` resolve os próprios transitivos a partir do que os
nossos `package.json` declaram — por isso a correção teve que ser nas
dependências diretas.

## Sobre o express 5

O CLI usa express de forma mínima: `express()`, três middlewares, um
`express.static` e um catch-all 404. Nenhuma rota com padrão (`:param`, `*`),
que é onde o `path-to-regexp` 8.x — a mudança mais dura do express 5 —
quebraria. Nenhuma linha de código precisou mudar.

Verificado com o dashboard no ar, e não só pelos testes (que mockam `http`):
página inicial com o WebSocket injetado, assets estáticos com o content-type
certo, 404 em rota inexistente, dotfiles negados, cabeçalhos de segurança
presentes e `X-Powered-By` ausente.
