---
'@opentask/taskin-file-system-provider': minor
'taskin': patch
---

`taskin lint --fix` traduz decisão que já estava escrita, só no formato errado.
`Priority: high/medium/low` (e `alta/média/baixa`) vira número por nível, depois
de quem já tem número, sem tocar em nenhuma prioridade numérica. Em tarefa
`done`, item aberto que se anota como fora (`(galeria — pendente)`, `(fora do
escopo …)`) vira `— adiado: <a própria anotação>`, sem nunca marcar `[x]`. Cada
conversão sai como info. O que o `--fix` não sabe ler (`Priority: amanhã`, item
sem anotação, `Difficulty` fora da faixa) continua erro, agora com sugestão e
sem o `💡 Run with --fix` que mandava rodar um conserto que não existia.
