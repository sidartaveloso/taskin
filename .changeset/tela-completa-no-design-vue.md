---
'@opentask/taskin-design-vue': minor
'@opentask/taskin-dashboard': patch
---

A tela completa do dashboard — a barra do topo (telas, filtro de status, busca,
ordem, pontuação, contagem e conexão) e a troca entre o Board e a priorização —
vira um componente de página no design-vue, e ganha stories.

- `design-vue`: nova página `TaskinWorkspace`. Recebe as tarefas já recortadas,
  o total, os grupos, a conexão e as escolhas atuais por props, e emite cada
  escolha (`update:view`, `update:filter`, `update:search`, `update:sort`,
  `update:score`, `retry`), repassando `update-task`, `update-group` e `move`
  da priorização. Não lê URL nem store, e não filtra. Exporta também os tipos
  `WorkspaceView`, `WorkspaceFilter`, `WorkspaceSort`, `WorkspaceScore` e as
  listas `WORKSPACE_VIEWS`, `WORKSPACE_FILTERS`, `WORKSPACE_SORTS`,
  `WORKSPACE_SCORES`.
- `dashboard`: o `App.vue` fica só com a ligação ao store, à URL e ao domínio,
  e saem os exemplos do `storybook init` (`src/stories`).
