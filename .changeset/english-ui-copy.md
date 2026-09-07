---
'@opentask/taskin-design-vue': minor
'@opentask/taskin-dashboard': patch
---

Padroniza em ingles o texto que o usuario le nos componentes.

Continuando a padronizacao do `ui-sense`, agora nos componentes do produto:

- `TaskCard`: o mapa de status ("Pendente", "Em Progresso", "Pausada",
  "Em Revisão", "Concluída", "Bloqueada", "Cancelada"), o titulo
  "Progresso Diário" e os rotulos de data "Prazo:" e "Início:"
- `TaskGrid`: os rotulos das estatisticas
- `PriorityGroupRenderer`: os `title` dos botoes de mover, agrupar e desagrupar,
  que sao tooltip e portanto texto visivel
- `PrioritizationScreen`: o `aria-label` do seletor de modo, as opcoes de
  ordenacao, o rotulo "Ícones" e o aviso de lista vazia
- `dashboard`: a aba "Priorização" e os textos de status da conexao

Ficam de proposito em portugues: comentarios de codigo, a documentacao das
stories e os arquivos de `TASKS/`. Comentario em portugues e a convencao do
repositorio, e traduzi-los seria um diff enorme sem ganho para quem usa o
produto.
