# 🧩 Task 116 — Listar so as tarefas abertas por padrao, com --all para ver todas

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1110

## Description
A pergunta de quem abre a lista e o que falta fazer, e as tarefas fechadas so crescem. O padrao passa a ser as abertas na CLI, no list_tasks do MCP e no dashboard, e um criterio all mostra todas. O padrao vale so quando nao ha criterio de status: --status, --closed e --active continuam como hoje. O padrao e o criterio all moram no dominio (FilterCriteriaSchema e filterTasks), de onde as tres superficies derivam; --open continua aceito.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Decidir o nome e a forma: criterio `all` no `FilterCriteriaSchema` e flag `--all` na CLI; `--all` combinado com `--open`, `--closed` ou `--active` e recusado
- [ ] O padrao "abertas" mora no dominio (`filterTasks` ou uma funcao de criterios efetivos ao lado dele), **nao** em cada superficie: sem nenhum criterio de status, aplica-se `open`
- [ ] Criterio de status explicito desliga o padrao: `--status done`, `--closed` e `--active` devolvem o mesmo que hoje — teste para cada um, porque o erro facil e a interseccao com `open` dar lista vazia
- [ ] `--open` continua aceito (o `.sandcastle/prompt.md` e scripts ja usam) e passa a ser redundante; dizer isso no `--help`
- [ ] CLI (`taskin list`, texto e `--json`) e `list_tasks` do MCP ganham o padrao e o `all` pela derivacao, sem edicao propria — se precisar editar, a derivacao tem furo
- [ ] Dashboard: sem `?filter=`, mostra as abertas; `?filter=all` mostra todas; um controle visivel na tela para alternar, porque parametro de URL ninguem descobre
- [ ] Contadores do dashboard (o bloco de total do quadro): decidir e declarar se contam as visiveis ou todas, e rotular de acordo
- [ ] Conferir quem consome a listagem e dependia de ver as fechadas: `prioritize`, `lint`, o prompt do sandcastle, os testes e2e
- [ ] Changeset declarando a mudanca de comportamento: quem consome `list --json` passa a receber so as abertas
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

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
