---
'@opentask/taskin-task-manager': minor
'@opentask/taskin-design-vue': minor
'@opentask/taskin-dashboard': minor
'taskin': patch
---

Busca, ordem e pontuação valem para as duas telas do dashboard, pelo domínio e
na URL.

- `task-manager`: o critério `text` do `filterTasks` casa também o tipo (id,
  título, tipo, status e responsável). `taskin list [filter]` e o `list_tasks`
  do MCP ganham junto.
- `dashboard`: busca, ordem (`manual`, `diff-desc`, `diff-asc`) e pontuação
  (`scored`/`unscored`) saem da tela de priorização para a barra do topo,
  aplicadas pelo `filterTasks` e pelo `ordenarTarefas`, e ficam na URL como
  `?q=`, `?sort=` e `?score=`. O título do Board segue o recorte (`Open tasks`,
  `Active tasks`, `Closed tasks`, `All tasks`).
- `design-vue`: o `usePrioritization` não filtra nem ordena por conta própria —
  saem `filter`, `scoreFilter`, `setFilter`, `setScoreFilter`, `setSortMode` e o
  tipo `PrioritizationScoreFilter`; a ordem entra por `options.sortMode` (a
  `PrioritizationPage` ganha a prop `sortMode`), e a arvore sai do
  `ordenarTarefas` nos três modos. A `PrioritizationScreen` perde a busca e os
  dois seletores. A ordem deixa de ser guardada no `localStorage`. `TaskGrid`
  ganha `title` e `Dashboard` ganha `gridTitle`.
