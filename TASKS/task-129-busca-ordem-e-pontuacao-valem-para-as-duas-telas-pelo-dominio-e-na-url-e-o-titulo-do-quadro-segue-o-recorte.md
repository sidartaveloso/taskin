# 🧩 Task 129 — Busca, ordem e pontuacao valem para as duas telas, pelo dominio e na URL, e o titulo do quadro segue o recorte

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 787

## Description
A busca por texto, a ordem (manual, diff-asc, diff-desc) e o recorte Scored/Unscored so existem na tela de priorizacao, e la sao reimplementados dentro do usePrioritization: a busca casa id, tipo e titulo, enquanto o filterTasks do dominio, que a CLI usa, casa id, titulo, status e responsavel. O dominio ja tem os tres (criterio de texto, scored/unscored da task-102, ordenarTarefas da task-070). Levar os tres para a barra comum, aplicados pelo dominio no App como o filtro Open/Closed ja e, e guardados na URL como ?view= e ?filter=. E o titulo do quadro diz Tarefas em Andamento qualquer que seja o recorte, mesmo com Closed.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A busca por texto do dashboard passa a ser o criterio `text` do `filterTasks` (`packages/task-manager/src/filter-tasks/`), e nao a propria do `usePrioritization`. Hoje as duas casam campos diferentes: o dominio casa id, titulo, status e responsavel; a priorizacao casa id, **tipo** e titulo. Para nao perder o que a priorizacao ja fazia, o `text` do dominio passa a casar tambem o tipo — o que a CLI (`taskin list [filter]`) e o `list_tasks` do MCP ganham junto, com teste no dominio
- [ ] O recorte Scored/Unscored passa a ser os criterios `scored`/`unscored` do dominio (task-102), e nao o `scoreFilter` do composable
- [ ] A ordem passa a ser o `ordenarTarefas` do dominio (`manual`, `diff-asc`, `diff-desc`, task-070), e nao o `sortRecursive` do composable; o arrastar e as setas continuam so no modo `manual`
- [ ] Os tres controles saem da `PrioritizationScreen` para a barra do topo do `App.vue`, comum as duas telas; na priorizacao ficam so os de desenho (Cards/Icons/Grid, colapsar e expandir, desfazer e refazer, JSON)
- [ ] Os tres na URL, como `?view=` e `?filter=`: `?q=`, `?sort=` e `?score=`, sem que gravar um apague os outros; valor desconhecido cai no padrao. A ordem hoje e guardada no `localStorage` do composable — decidir e declarar o que acontece com essa preferencia
- [ ] O Board aplica os tres: a busca e a pontuacao filtram os cards, e a ordem ordena
- [ ] O titulo do quadro segue o recorte de status (Open, Active, Closed, All), e nao fica fixo em "Tarefas em Andamento" (`packages/design-vue/src/components/templates/TaskGrid.vue`). Idioma: o da barra do topo, que e ingles
- [ ] O `usePrioritization` deixa de filtrar e de ordenar por conta propria: a regra existe uma vez, no dominio. As stories e os testes do composable que cobriam o filtro e a ordem internos migram para onde a regra passou a morar
- [ ] TDD: `App.spec.ts` (URL, barra comum, as duas telas), dominio (`text` casando o tipo), composable
- [ ] Verificar no dashboard aberto do `.bench500` nas duas telas, com o `?q=`, `?sort=` e `?score=` sobrevivendo ao recarregar
- [ ] Documentacao nas quatro frentes, pelo que muda no `taskin list [filter]`: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que

O argumento e o da task-128 com a conexao: busca, ordem e pontuacao dizem
**quais tasks e em que ordem**, e nao como desenhar. Presos a priorizacao, o
Board nao busca nem ordena, e o recorte se perde ao trocar de tela.

E ha a divergencia: o dashboard reimplementa tres regras que o dominio ja tem,
e a mesma busca da resultados diferentes na CLI e no dashboard. E o defeito que
mais apareceu neste repositorio — a copia mantida a mao que diverge em silencio.

### O titulo

Com o filtro em Closed, o quadro mostra tarefas concluidas sob o titulo
"Tarefas em Andamento". O titulo tem que descrever o recorte.
