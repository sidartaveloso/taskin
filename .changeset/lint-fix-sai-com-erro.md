---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-file-system-provider': patch
'taskin': patch
---

`taskin lint --fix` passa a sair com 1 quando sobra erro que ele não corrige.

Antes, com `--fix`, o comando nunca saía com erro: imprimia o que não tinha
conseguido corrigir — um anexo acima do teto, por exemplo — e terminava com 0.
Agora ele corrige o que dá, diz quantos erros restaram e sai com 1.

O `ValidationIssue` ganha `fixable?: boolean`. O validador de anexos marca os
seus erros como `fixable: false`, e o `taskin lint` sem `--fix` só sugere rodar
`--fix` quando algum erro pode ser corrigido por ele.
