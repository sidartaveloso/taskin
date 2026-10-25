# 🧩 Task 141 — taskin list e list_tasks aceitam limit e offset, aplicados depois de filtrar e ordenar

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
Um consumidor que pega X tarefas por vez nao precisa receber a fila inteira. Caso que originou: o Sandcastle do geohub (.sandcastle/fila-de-tarefas) entrega ao agente uma tarefa por rodada e hoje leria as 384 de taskin list --json para usar a primeira. Pedido: --limit <n> e --offset <n> no taskin list (texto e --json) e limit/offset no list_tasks do MCP, com a mesma semantica nas duas superficies (e no listTasks do ITaskManager, de onde elas derivam). Semantica proposta: (1) limit e offset nao restringem o conjunto, recortam a janela, entao ficam ao lado de sort e fora do FilterCriteriaSchema, como sort ja fica; (2) aplicados DEPOIS de filtrar e ordenar: offset pula as n primeiras da ordem pedida (manual = prioridade crescente, diff-asc, diff-desc) e limit corta as seguintes; aplicar antes do filtro faria a tarefa descartada ocupar vaga e devolveria menos que limit; (3) contam tarefas, nao nos de grupo: a janela e tomada na ordem achatada e a saida agrupada mostra so os grupos com membro dentro dela, com o contador de omitidas dizendo quantas ficaram fora; (4) inteiros, offset >= 0 e limit >= 1, recusados antes de listar com mensagem e saida 1 na CLI e erro no MCP; (5) o --json precisa permitir saber se ha mais paginas sem mudar o formato do array, decidir como (ex.: total no texto, ou envelope opcional). Relacionado e fora desta task: para o limit servir ao Sandcastle sem o consumidor refiltrar, faltam criterios para excluir in-review do --open (varios status ou exclusao de status) e para excluir tarefas reservadas (por grupo ou por id).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
Add any relevant notes or links here.
