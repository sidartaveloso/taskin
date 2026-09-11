---
'@opentask/taskin-file-system-provider': patch
---

`## Status atual` no corpo da task deixa de ser acusado como metadado em seção,
e travessão passa a contar como "ninguém ainda".

**O falso positivo.** A regra que proíbe metadado em seção testava
`##\s*Status` contra o **arquivo inteiro**, sem âncora. Qualquer seção cujo
título começasse com a palavra — `## Status atual`, `## Status do deploy` —
virava um erro que nenhum `--fix` resolvia: o `fixTaskFile` não migra esses
(o padrão de migração exige a quebra de linha logo após a palavra), então o
erro ficava para sempre.

Passa a exigir o cabeçalho **exato**: `## Status`, em qualquer nível. É o texto
que discrimina, não o nível — `### Status` também é migrado pelo `--fix` e
segue sendo acusado.

**As barras.** A lista de placeholders aceitava `-`, mas não `–` nem `—`. Quem
escreve à mão usa o travessão com a mesma intenção, e o valor virava pessoa
fabricada nas métricas.

Os dois achados vieram de rodar o lint em projetos reais.
