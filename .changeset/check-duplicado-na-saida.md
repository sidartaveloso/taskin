---
'taskin': patch
---

O símbolo da mensagem deixa de aparecer duas vezes.

```
✓ ✓ Created .taskin.json
✓ ✓ User "sidartaveloso" (sidartaveloso@gmail.com) created successfully!
```

`success`, `error`, `info` e `warning` já prefixam `✓`, `✗`, `ℹ` e `⚠`. Eram 24
chamadas que passavam a mensagem começando pelo mesmo símbolo, em 8 arquivos —
`init`, `start`, `pause`, `finish`, `review`, `new`, `dashboard` e
`mcp-server`.

Nenhum teste percebia, porque nenhum olhava a saída. Entra uma guarda que lê o
próprio fonte e falha nomeando arquivo e linha: é mais barato que afirmar a
saída de cada comando, e pega a regressão onde ela nasce.

Os dois `console.error('❌ ...')` do `export` ficam como estão — não passam pelo
helper, então não duplicam.
