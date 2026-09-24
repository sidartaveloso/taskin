---
'@opentask/taskin-task-manager': major
'taskin': major
'@opentask/taskin-task-server-mcp': minor
'@opentask/taskin-dashboard': minor
'@opentask/taskin-types': minor
'@opentask/taskin-design-vue': patch
---

A listagem mostra so as tarefas abertas por padrao, e `all` mostra todas.

- **Quebra compatibilidade**: `taskin list` (texto e `--json`), `list_tasks` do
  MCP e `filterTasks` sem criterio de status passam a devolver so as abertas
  (pending, in-progress, paused, in-review, blocked). Quem consome `list --json`
  e queria as fechadas passa a pedir `--all`.
- O padrao mora no dominio: `filterTasks` aplica `effectiveFilterCriteria`
  (exportada), e a CLI, o MCP e o dashboard derivam dele. `status`, `open`,
  `closed` e `active` explicitos desligam o padrao — `--status done` devolve o
  mesmo que antes.
- Criterio novo `all` no `FilterCriteriaSchema`: flag `--all` na CLI, propriedade
  `all` no `list_tasks`. `parseFilterCriteria` recusa `all` com `open`, `closed`
  ou `active`. `--open` continua aceito, agora redundante.
- O recurso MCP `taskin://tasks` ("All Tasks") segue trazendo todas.
- Dashboard: sem `?filter=`, as abertas; um controle na tela alterna entre
  Open, Active, Closed e All (e reescreve a URL), com "Showing N of M tasks".
  `taskin dashboard --all` abre em todas. O contador do quadro passa de "Total"
  a "Shown": conta as visiveis.
