# 🧩 Task 129 — Busca, ordem e pontuacao valem para as duas telas, pelo dominio e na URL, e o titulo do quadro segue o recorte

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 787
- Group: g-n1xf2yf7

## Description
A busca por texto, a ordem (manual, diff-asc, diff-desc) e o recorte Scored/Unscored so existem na tela de priorizacao, e la sao reimplementados dentro do usePrioritization: a busca casa id, tipo e titulo, enquanto o filterTasks do dominio, que a CLI usa, casa id, titulo, status e responsavel. O dominio ja tem os tres (criterio de texto, scored/unscored da task-102, ordenarTarefas da task-070). Levar os tres para a barra comum, aplicados pelo dominio no App como o filtro Open/Closed ja e, e guardados na URL como ?view= e ?filter=. E o titulo do quadro diz Tarefas em Andamento qualquer que seja o recorte, mesmo com Closed.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A busca por texto do dashboard passa a ser o criterio `text` do `filterTasks` (`packages/task-manager/src/filter-tasks/`), e nao a propria do `usePrioritization`. Hoje as duas casam campos diferentes: o dominio casa id, titulo, status e responsavel; a priorizacao casa id, **tipo** e titulo. Para nao perder o que a priorizacao ja fazia, o `text` do dominio passa a casar tambem o tipo — o que a CLI (`taskin list [filter]`) e o `list_tasks` do MCP ganham junto, com teste no dominio — `filter-tasks.ts` casa `task.type`; teste `o texto livre procura tambem no tipo` em `packages/task-manager/src/filter-tasks/filter-tasks.test.ts`; a descricao derivada (ajuda da CLI e schema do `list_tasks`) diz `Free text over id, title, type, status and assignee`
- [x] O recorte Scored/Unscored passa a ser os criterios `scored`/`unscored` do dominio (task-102), e nao o `scoreFilter` do composable — `criterios` em `packages/dashboard/src/App.vue`; `scoreFilter`/`setScoreFilter`/`PrioritizationScoreFilter` removidos do design-vue; teste `na tela %s, \`?score=\` recorta pontuadas e nao pontuadas`
- [x] A ordem passa a ser o `ordenarTarefas` do dominio (`manual`, `diff-asc`, `diff-desc`, task-070), e nao o `sortRecursive` do composable; o arrastar e as setas continuam so no modo `manual` — o App ordena a lista e passa `sortMode` a `PrioritizationPage`, que o entrega ao composable (`options.sortMode`); `buildPriorityTree` recebe o modo e chama `ordenarTarefas`; `sortRecursive` removido. Testes: `na tela %s, \`?sort=\` ordena pelo ordenarTarefas`, `a ordem chega a priorizacao`, `monta a arvore na ordem que recebe, pela regra do dominio, e so arrasta em manual`, `fora do modo manual nao faz nada`, e `os botoes somem e voltam quando a ordem troca de fora` (o `dragEnabled` do `provide` era copiado no setup e nao seguia a prop)
- [x] Os tres controles saem da `PrioritizationScreen` para a barra do topo do `App.vue`, comum as duas telas; na priorizacao ficam so os de desenho (Cards/Icons/Grid, colapsar e expandir, desfazer e refazer, JSON) — `.query-controls` no `App.vue` (`search-input`, `sort-select`, `score-select`); testes `os tres controles ficam na barra do topo, e mostram o que a URL pediu` e `a barra da tela so tem os controles de desenho: sem busca, ordem ou pontuacao` (`PrioritizationScreen.spec.ts`)
- [x] Os tres na URL, como `?view=` e `?filter=`: `?q=`, `?sort=` e `?score=`, sem que gravar um apague os outros; valor desconhecido cai no padrao. A ordem hoje e guardada no `localStorage` do composable — decidir e declarar o que acontece com essa preferencia — `gravarNaUrl`/`daUrl` no `App.vue`; busca vazia tira o `?q=`. **Decisao:** a ordem sai do `localStorage`; um `sortMode` guardado e ignorado ao ler e nao e mais gravado (so `viewMode` e grupos recolhidos ficam la), e sem `?sort=` a ordem e `manual` — o link manda, e nao o navegador. Testes: `gravar um nao apaga os outros, e a tela e o filtro ficam`, `apagar a busca tira o \`?q=\` da URL`, `valor desconhecido cai no padrao`, `trocar de tela nao perde a busca, a ordem nem a pontuacao`, e no composable `nao guarda a ordem no localStorage: ela mora na URL de quem hospeda`
- [x] O Board aplica os tres: a busca e a pontuacao filtram os cards, e a ordem ordena — a mesma `tasks` do App vai ao Board; os testes `na tela board, ...` de `?q=`, `?score=` e `?sort=` em `App.spec.ts`
- [x] O titulo do quadro segue o recorte de status (Open, Active, Closed, All), e nao fica fixo em "Tarefas em Andamento" (`packages/design-vue/src/components/templates/TaskGrid.vue`). Idioma: o da barra do topo, que e ingles — `TaskGrid` ganha `title` (padrao `Tasks`), `Dashboard` ganha `gridTitle`, e o App passa `Open tasks`/`Active tasks`/`Closed tasks`/`All tasks`. Testes: `em %s o titulo e "%s"` e `trocar o filtro troca o titulo` (`App.spec.ts`), `o titulo da lista e o que quem recortou diz, e nao um fixo` (`Dashboard.spec.ts`)
- [x] O `usePrioritization` deixa de filtrar e de ordenar por conta propria: a regra existe uma vez, no dominio. As stories e os testes do composable que cobriam o filtro e a ordem internos migram para onde a regra passou a morar — saem `filter`, `scoreFilter`, `setFilter`, `setScoreFilter`, `setSortMode`; `tree` e a arvore recebida. Os testes do filtro interno viraram os de `App.spec.ts` e o do tipo no dominio; os de topo/fim "com filtro" passaram a recortar a lista de fora (`recortar` no `comDominio`). A story `Default` da `PrioritizationScreen` perdeu a parte de ordem e pontuacao, e a nova `SortedByTheHost` prova a ordem vinda de fora
- [x] TDD: `App.spec.ts` (URL, barra comum, as duas telas), dominio (`text` casando o tipo), composable — os 19 testes novos do App falharam antes da implementacao; 40/40 depois
- [ ] Verificar no dashboard aberto do `.bench500` nas duas telas, com o `?q=`, `?sort=` e `?score=` sobrevivendo ao recarregar — adiado: o sandbox nao tem navegador (o Chromium do Playwright nao roda por falta de bibliotecas do sistema). Fica para quem abrir o dashboard fora dele, como nas tasks 101, 118 e 128. O que o recarregar faz esta coberto em `App.spec.ts`: o estado e lido da URL no mount
- [x] Documentacao nas quatro frentes, pelo que muda no `taskin list [filter]`: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas — `README.md` (`taskin list fix` e os parametros de URL do dashboard), `packages/cli/README.md` (`[filter]` casa o tipo), `docs/ARCHITECTURE.md` (quem filtra e ordena no dashboard), `packages/docs/content/{index.md,pt-br/index.md}` (texto livre e a barra do topo). Changeset em `.changeset/busca-ordem-e-pontuacao-nas-duas-telas.md`
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` — lint, typecheck e format limpos. `pnpm test`: passa tudo menos o que precisa de navegador (`design-vue` e `ui-sense`); o design-vue inteiro passa com `npx vitest run --browser.enabled=false --environment jsdom` (309 testes), e as stories `Default` e `SortedByTheHost` passaram o `play` por `composeStories` em jsdom. Os e2e da CLI estouraram tempo sob carga paralela e passam sozinhos (`npx vitest run src/cli.e2e.test.ts`, 34/34)

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

### O que ficou decidido

- **Quem recorta, quem desenha.** O `App.vue` aplica `filterTasks` e
  `ordenarTarefas` e entrega a lista pronta as duas telas. O quadro recebe so o
  modo de ordem, porque precisa saber se arrasta e porque o desfazer remonta a
  arvore. Com isso, o topo e o fim "da lista visivel" (task-101) passam a ser os
  da lista que o App entregou.
- **Um efeito disso:** um grupo com membros fora do recorte nao sabe mais deles
  (antes a busca do quadro escondia, mas o quadro conhecia). Mover uma tarefa
  para depois de um grupo assim usa o ultimo membro **visivel** como referencia.
  O recorte Open/Closed do App ja funcionava assim antes desta task.
- **A ordem muda um pouco nos modos de dificuldade.** O `sortRecursive` punha a
  tarefa sem nota no comeco em `diff-asc` e ordenava grupos pelo maior membro
  nas duas direcoes. Agora vale a regra do `ordenarTarefas` (sem nota no fim, e o
  grupo no lugar do primeiro membro), a mesma do `taskin list --sort`.

