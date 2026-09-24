---
'@opentask/taskin-design-vue': minor
'@opentask/taskin-dashboard': patch
'taskin': patch
---

O estado da conexão com o servidor passa a aparecer na barra do topo do
dashboard, nas duas telas: a priorização grava pelo servidor a cada movimento e
também precisa mostrar quando a conexão cai.

- `design-vue`: nova molécula `ConnectionStatus` (indicador, texto e botão de
  tentar de novo), usada pelo `DashboardHeader`. `Dashboard`, `DashboardLayout`
  e `DashboardHeader` ganham `showConnection` (padrão `true`), para quem mostra a
  conexão em outro lugar.
