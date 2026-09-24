# 🧩 Task 118 — O quadro de priorizacao move pelas operacoes do dominio, sem numerar sozinho

- Status: done
- Type: refactor
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1130

## Description
Desde a task-106 o dashboard grava por operacoes nomeadas, mas o usePrioritization ainda calcula os numeros por conta propria, e a regra de numeracao existe duas vezes: no composable e no posicionarPrioridade do dominio. O quadro passa a mandar move-before e move-after tendo como referencia a primeira ou a ultima task visivel, o que preserva o topo da lista filtrada, e o desfazer passa a reenviar os valores anteriores das tarefas que a operacao devolveu como alteradas.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Mover para cima, para baixo, topo e fim no quadro mandam `move-before`/`move-after` pelo fio, com a **primeira ou a ultima task visivel** como referencia — o topo continua sendo o da lista filtrada (task-101), e sem filtro coincide com o `move-to-top` do dominio — `moverNaListaVisivel` em `use-prioritization.ts` emite `onMove`; `operacaoDoMovimento` (`packages/dashboard/src/operacoes-da-mudanca/`) o traduz. Provas em `packages/design-vue/src/composables/use-prioritization/use-prioritization.test.ts`: `leva a tarefa para o topo pedindo move-before da primeira linha…`, `…para o fim pedindo move-after…`, `sem filtro, o topo visivel coincide com o move-to-top do dominio`, `com filtro, o topo e o da lista visivel…`, `subir uma tarefa grava so a tarefa que subiu`
- [x] O mesmo para grupos, com as operacoes da task-117 — `move-group-before`/`move-group-after`; testes `grupo sobe para o topo e desce para o fim da lista de fora, pelas operacoes de grupo`, `grupo respeita o filtro…`, `moveUp moves a group before another group`, e `operacaoDoMovimento` em `operacoes-da-mudanca.test.ts`
- [x] Arrastar tambem passa pelas operacoes — `moveBefore`/`moveAfter`/`moveGroupBefore`/`moveGroupAfter` emitem movimento; cair em outro grupo muda o grupo localmente (vai como `assign-to-group`) e o numero pelo dominio. Testes `moveBefore pede move-before ao dominio, sem numerar nada`, `moveBefore sobre uma tarefa de outro grupo muda o grupo aqui e o numero no dominio`, `arrastar um grupo sobre um membro de outro grupo mira o outro grupo`
- [x] O desfazer e o refazer: antes de mandar, o quadro guarda os valores anteriores das tasks que a operacao devolve como alteradas; desfazer reenvia `set-priority` (e `assign-to-group`/`remove-from-group` quando for o caso) com esses valores. Grava so o que mudou — o historico guarda valores (`ValoresDaTarefa`), nao a arvore; `aplicarValores` reescreve e o `changedTasks` sai so com quem difere, que o `App.vue` manda por `operacoesDaMudanca`. Testes `undo reenvia o valor anterior so das tarefas que o movimento alterou`, `redo reaplica os valores…`, `undo de uma mudanca de grupo reenvia o grupo anterior`, `desfazer grava de volta so o que o movimento alterou` (500 tarefas → 1 arquivo). A reducao as alteradas e feita pelo diff na hora de desfazer, e nao na resposta do servidor: uma edicao concorrente de outro cliente entre o movimento e o desfazer tambem seria revertida
- [x] Remover do `usePrioritization` a numeracao propria (`numerarMovidos` e afins): a regra passa a existir **uma vez**, no dominio — sairam `commit`, `numerarMovidos`, `itensDaArvore`, `renumber` e a opcao `orderStep`; `grep -n "numerarMovidos\|renumber\|orderStep" packages/design-vue/src` nao acha nada. Os testes usam `posicionarPrioridade`/`posicionarGrupo` do `task-manager` como servidor (`comDominio`)
- [x] Conferir que o custo nao piora — medido fora do sandbox, no dashboard do `.bench500` (500 tarefas), contando com `git status` no repositorio do bench apos cada clique: topo de uma tarefa do meio **1** arquivo, grupo de 3 ao fim **3** (so os membros), e o Desfazer devolveu os 3. Os mesmos numeros da task-101, agora com o dominio numerando. No sandbox o equivalente sem navegador esta em `custo no cenario de 500 tarefas`
- [x] Os botoes continuam so no modo `manual` — `moverNaListaVisivel` sai cedo fora do `manual`; teste `fora do modo manual nao faz nada…` (setas, topo e grupo)
- [x] TDD no composable e no `App.vue` (a traducao `operacoesDaMudanca` da 106 deve encolher ou sumir) — `App.spec.ts`: `um movimento do quadro vai ao dominio como move-before, sem set-priority calculado`; `PrioritizationPage.spec.ts`: `emite move com o movimento…`. A `operacoesDaMudanca` **nao encolheu**: continua com `set-priority`, que o desfazer usa para reenviar o valor anterior, e com grupo e dificuldade; o que saiu dela foi o papel de mover
- [x] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas — `README.md` (secao do dashboard), `packages/cli/README.md` (`taskin dashboard`), `docs/ARCHITECTURE.md` (fluxo do dashboard), `packages/docs/content/{index.md,pt-br/index.md}` (paragrafo do `ITaskManager`)
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` — lint, typecheck e format limpos. `pnpm test`: tudo passa menos o que precisa de navegador (`design-vue` e `ui-sense`, Chromium sem bibliotecas no sandbox); o design-vue inteiro passa com `npx vitest run --browser.enabled=false --environment jsdom` (289 testes). O e2e `mcp-server` da CLI estourou o tempo uma vez sob carga e passa sozinho

## Notes

### Por que

Desde a 106 o dashboard grava por operacoes nomeadas, mas o `usePrioritization`
ainda **calcula os numeros** e so manda o resultado. A regra de numeracao existe
duas vezes: no composable e no `posicionarPrioridade` do dominio. E o defeito que
mais apareceu neste repositorio — uma copia mantida a mao que diverge em
silencio.

### As duas decisoes que a 114 deixou, resolvidas

1. **Topo visivel ou topo da fila.** O quadro manda a referencia: primeira ou
   ultima task visivel. Nao precisa de operacao nova, e com filtro o topo
   continua sendo o que a pessoa esta vendo.
2. **O desfazer.** Toda operacao devolve as tasks alteradas; o quadro guarda o
   valor anterior delas antes de mandar e, para desfazer, reenvia esses valores.
   E exato e grava so o que mudou.

### Ordem

Depois da 117.
