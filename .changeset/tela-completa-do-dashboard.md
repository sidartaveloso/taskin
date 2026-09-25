---
'@opentask/taskin-dashboard': patch
---

A tela completa do dashboard — a barra do topo (telas, filtro de status, busca,
ordem, pontuação, contagem e conexão) e a troca entre o Board e a priorização —
vira o componente de página `TaskinWorkspace`, em
`packages/dashboard/src/components/pages/`, com stories e testes.

- Mora no dashboard, e não no design-vue: é a tela desta aplicação, composta
  das peças do design-vue (`Dashboard`, `PrioritizationPage`,
  `ConnectionStatus`). Recebe as tarefas já recortadas, o total, os grupos, a
  conexão e as escolhas atuais por props, e emite cada escolha. Não lê URL nem
  store, e não filtra.
- O `App.vue` fica só com a ligação ao store, à URL e ao domínio, e saem os
  exemplos do `storybook init` (`src/stories`).
- As stories do dashboard entram no Storybook da raiz e rodam no `pnpm test`,
  no Chromium. O `test` do pacote deixa de terminar em `|| true`, que engolia
  qualquer falha.
