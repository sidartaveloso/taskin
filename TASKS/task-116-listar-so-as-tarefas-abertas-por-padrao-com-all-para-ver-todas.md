# 🧩 Task 116 — Listar so as tarefas abertas por padrao, com --all para ver todas

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1110

## Description
A pergunta de quem abre a lista e o que falta fazer, e as tarefas fechadas so crescem. O padrao passa a ser as abertas na CLI, no list_tasks do MCP e no dashboard, e um criterio all mostra todas. O padrao vale so quando nao ha criterio de status: --status, --closed e --active continuam como hoje. O padrao e o criterio all moram no dominio (FilterCriteriaSchema e filterTasks), de onde as tres superficies derivam; --open continua aceito.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Decidir o nome e a forma: criterio `all` no `FilterCriteriaSchema` e flag `--all` na CLI; `--all` combinado com `--open`, `--closed` ou `--active` e recusado — `packages/task-manager/src/filter-tasks/filter-criteria.ts` (`all` + `recusarAllComRecorte` em `parseFilterCriteria`); testes `o criterio all > recusa \`all\` combinado com \`%s\`` em `filter-criteria.test.ts`. A recusa fica fora do schema porque um `z.object` refinado deixa de aceitar `.extend` (usado pelo teste de derivacao). `all` com `status` e aceito: o status vence.
- [x] O padrao "abertas" mora no dominio: `effectiveFilterCriteria` ao lado de `filterTasks` (`packages/task-manager/src/filter-tasks/filter-tasks.ts`, exportada), aplicada dentro de `filterTasks`. Testes: `o padrao e so as abertas` em `filter-tasks.test.ts`. O texto livre e os demais criterios nao desligam o padrao.
- [x] Criterio de status explicito desliga o padrao: testes `\`status\` explicito desliga o padrao`, `\`closed\` desliga o padrao`, `\`active\` desliga o padrao` (dominio) e `--closed`, `--active`, `--status done` em `packages/cli/src/commands/list.json.test.ts` (`so as abertas por padrao`).
- [x] `--open` continua aceito: a descricao derivada diz "already the default, kept for scripts" (`node packages/cli/dist/index.js list --help`); testes `\`open\` continua aceito` (dominio) e `\`--open\` continua aceito` (CLI). O `.sandcastle/prompt.md` segue com `--open`, sem mudanca.
- [x] CLI (`taskin list`, texto e `--json`) e `list_tasks` do MCP ganham o padrao e o `all` pela derivacao, sem edicao propria: nenhum filtro novo escrito em `list.ts` nem em `handleListTasks` (so a descricao do comando `list` mudou de texto). Testes: CLI `so as abertas por padrao` (JSON e tabela); MCP `sem criterio, devolve so as abertas; \`all\` devolve todas`, `anuncia \`all\` no schema`, `recusa \`all\` combinado com \`closed\`` em `packages/task-server-mcp/src/list-tasks.test.ts`. Unica edicao no MCP: o recurso `taskin://tasks` ("All Tasks") passa `all: true` para continuar trazendo todas.
- [x] Dashboard: sem `?filter=`, as abertas (criterio vazio, o padrao vem de `filterTasks`); `?filter=all` todas; controle `.filter-toggle` com Open/Active/Closed/All que reescreve a URL, e o botao aceso sai de `effectiveFilterCriteria` — `packages/dashboard/src/App.vue`. `taskin dashboard --all` abre em `?filter=all` (`packages/cli/src/commands/dashboard.ts`). Testes em `packages/dashboard/src/App.spec.ts`: `should show only open tasks when no filter is set`, `should show every task when filter=all`, `a visible control switches to all, ...`.
- [x] Contadores do dashboard: contam as **visiveis**. O rotulo do quadro passou de "Total" a "Shown" (`packages/design-vue/src/components/templates/TaskGrid.vue`) e a barra do filtro diz "Showing N of M tasks", onde M e o total (teste `a visible control switches to all, and says how many of the total are shown`).
- [x] Conferir quem consome a listagem: `filterTasks` so e chamado pela CLI `list`, pelo MCP e pelo dashboard (`grep -rn filterTasks packages`); `prioritize` e `lint` usam `getAllTasks` direto e nao mudam. O prompt do sandcastle usa `--json --open`, igual. Os e2e que liam uma task concluida no `list` passaram a `list --all` (`packages/cli/src/cli.e2e.test.ts`: `should reflect status change in list command` do finish e `complete workflow`).
- [x] Changeset declarando a mudanca de comportamento: `.changeset/abertas-por-padrao.md` — major para `taskin` (4.x) e `task-manager` (3.x), porque `list --json` e `filterTasks({})` passam a devolver menos.
- [x] Documentacao nas quatro frentes: `README.md`, `packages/cli/README.md`, `packages/task-server-mcp/README.md`, `docs/{MCP_CLAUDE_SETUP,MCP_VSCODE_SETUP,QUICKSTART}.md`, `packages/docs/content/index.md` e `packages/docs/content/pt-br/index.md`.
- [x] Verificacao: `pnpm lint`, `pnpm typecheck` (28/28), `pnpm format` verdes. `turbo run test --continue`: task-manager 142, task-server-mcp 110, dashboard 16, fs-provider 405, pinia 12, ws 30; CLI 436/438 — as 2 falhas mudam a cada rodada (start/finish/notify, no `git commit` do setup) e aparecem tambem sem esta mudanca. design-vue e ui-sense nao rodam aqui: falta o Chromium do Playwright.

### Revisao: o binario de verdade, e o `status` que escapava da recusa

A revisao acrescentou `packages/cli/src/commands/list-default.e2e.test.ts`, que
roda o `dist/index.js` sobre um projeto temporario com quatro tarefas reais
(pendente, em andamento, concluida, cancelada) — os testes da CLI acima usam um
`TaskManager` simulado. Nove casos: o padrao, `--all`, `--closed`/`--active`/
`--status` trocando o padrao, `--open` igual ao padrao, o texto igual ao
`--json`, e a recusa de `--all` com cada recorte.

O ultimo caso achou uma falha: `--all --status done` era aceito e devolvia so
as concluidas, ignorando o `all` em silencio — o que o comentario de
`recusarAllComRecorte` diz evitar. A recusa passou a incluir `status`
(`packages/task-manager/src/filter-tasks/filter-criteria.ts`), com teste no
dominio (`recusa \`all\` combinado com \`status\``, em
`filter-criteria.test.ts`) e no MCP (`list-tasks.test.ts`), que herdou a regra
sem edicao propria. Rodar:
`cd packages/cli && npx vitest run --config vitest.e2e.config.ts src/commands/list-default.e2e.test.ts`.

## Notes

### Por que

Quem abre a lista quer saber o que falta fazer. As fechadas so crescem — neste
repositorio ja passam de cem — e empurram as abertas para fora da tela. O
padrao certo e o do trabalho em aberto, com as outras a um `--all` de distancia.

### As tres regras

1. **O padrao so vale sem criterio de status.** `--status done` com o padrao
   "abertas" intersectaria em lista vazia; o criterio explicito vence.
2. **O padrao mora no dominio.** O `FilterCriteriaSchema` ja e a definicao
   unica dos criterios (task-064); o padrao e o `all` entram la, e a CLI, o MCP
   e o dashboard (que ja chama `filterTasks`, em `packages/dashboard/src/App.vue`)
   derivam dele. Tres padroes escritos a mao divergiriam — e o defeito de sempre.
3. **E mudanca de comportamento**, e precisa aparecer no changeset e na
   documentacao, porque a saida `--json` serve qualquer ferramenta, nao so
   agentes.

### O que existe hoje

CLI e MCP: sem criterio, todas. Dashboard: `?filter=<criterio>` na URL,
aplicado com o `filterTasks` do dominio; sem o parametro, todas.
