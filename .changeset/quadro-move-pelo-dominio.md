---
'@opentask/taskin-design-vue': minor
'@opentask/taskin-dashboard': minor
---

O quadro de priorizacao move pelas operacoes do dominio, sem numerar sozinho.
Setas, topo, fim e arrastar emitem um movimento (`onMove` no `usePrioritization`,
evento `move` na `PrioritizationPage`) com a linha visivel de referencia, e o
dashboard o manda como `move-before` / `move-after` / `move-group-before` /
`move-group-after`. O desfazer guarda valores, e nao a arvore: reenvia o valor
anterior so das tarefas que a operacao alterou. Sai a numeracao propria do
composable — `renumber` e a opcao `orderStep` deixam de existir.
