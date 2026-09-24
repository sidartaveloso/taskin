# 🧩 Task 102 — Listar somente as tarefas que ja tem Difficulty definido

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Priority: 177
- Group: g-n1xf2yf7
- Difficulty: 2

## Description
Um criterio novo para restringir a listagem as tarefas que ja receberam dificuldade. O campo difficulty e opcional, de 1 a 5, e numa base em andamento convivem tarefas pontuadas e nao pontuadas; quem vai priorizar quer ver so as pontuadas, e quem vai pontuar quer justamente o contrario. O criterio entra no FilterCriteriaSchema do task-manager, que e a definicao unica: a flag da CLI, o schema JSON do list_tasks do MCP e a validacao saem dele, e o satisfies Record<keyof TaskFilterCriteria> impede esquecer alguma superficie. Na tela de priorizacao do dashboard entra como controle proprio, porque o filtro de la e de texto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Decidir o nome do criterio, e se ele tem par — `scored` e `unscored`, par como `open`/`closed`: os dois momentos (priorizar / pontuar) estao descritos na nota, e cada um e um dos dois
- [x] Acrescentar a propriedade ao `FilterCriteriaSchema` e a entrada em `FILTER_CRITERIA_SURFACES` — `packages/task-manager/src/filter-tasks/filter-criteria.ts`
- [x] Implementar o predicado no `filterTasks`, com teste: pontuada, nao pontuada, e o criterio ausente — `describe('filtros scored e unscored')` em `packages/task-manager/src/filter-tasks/filter-tasks.test.ts` (4 casos, inclusive a soma com `open`)
- [x] Conferir que a CLI e o `list_tasks` do MCP ganharam o criterio **sem edicao propria** — `git diff packages/cli/src packages/task-server-mcp` vazio; `pnpm taskin list --help` mostra `--scored`/`--unscored`; `pnpm taskin list --scored --open --json` devolve so as pontuadas; `filterCriteriaJsonSchema().properties.scored` e `{type: boolean, description}`. A derivacao nao tem furo.
- [x] Controle na tela de priorizacao do dashboard, separado do campo de texto — `select[data-testid=score-filter-select]` ao lado do seletor de ordenacao em `PrioritizationScreen.vue`; estado `scoreFilter`/`setScoreFilter` em `use-prioritization.ts` (testes `scoreFilter ...` em `use-prioritization.test.ts`); ligacao na pagina coberta em `PrioritizationPage.spec.ts` ("forwards screen commands"); passos no `play` da story `Default` de `PrioritizationScreen.stories.ts`
- [x] Documentacao: `README.md` da raiz, `packages/cli/README.md`, `docs/` (`MCP_CLAUDE_SETUP.md`, `MCP_VSCODE_SETUP.md`) e o site nos dois idiomas (`packages/docs/content/index.md`, `packages/docs/content/pt-br/index.md`)
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` — lint, typecheck e format verdes. `pnpm test`: todos os pacotes verdes, exceto `design-vue` e `ui-sense`, que rodam no Chromium do Playwright e aqui o host nao tem as bibliotecas do navegador. O `design-vue` passou inteiro em jsdom (265/265, `vitest run --browser.enabled=false --environment jsdom`); o `play` da story nao pode ser executado neste ambiente. A CLI teve e2e com timeout sob o turbo paralelo e passou 405/405 rodada sozinha.

## Notes

### O caso de uso

`difficulty` e opcional, de 1 a 5. Numa base em andamento convivem tarefas
pontuadas e nao pontuadas, e ha dois momentos distintos: **priorizar**, que quer
ver so as pontuadas, e **pontuar**, que quer exatamente o contrario — a fila do
que ainda falta avaliar.

Isso sugere que o criterio tenha par, como `open`/`closed` ja tem. Fica como
decisao a tomar, com a ressalva de que dois criterios so se justificam se o
segundo for de fato usado; um criterio que ninguem liga e peso morto na
interface.

### Onde ele entra

No `FilterCriteriaSchema` (`packages/task-manager/src/filter-tasks/filter-criteria.ts`),
que e a definicao unica. O comentario do arquivo descreve o procedimento em duas
linhas, e a segunda e cobrada pelo compilador:

1. uma propriedade `.optional()` no schema;
2. a entrada correspondente em `FILTER_CRITERIA_SURFACES`.

O `satisfies Record<keyof TaskFilterCriteria, CriterionSurface>` fecha o
circuito: acrescentar ao schema e esquecer a superficie **nao compila**. A flag
da CLI, o schema JSON do `list_tasks` e a validacao passam a conhecer o criterio
sem mais nenhuma edicao — foi assim que o filtro `active` chegou as tres
superficies na task-064.

**O passo que vale conferir de verdade** e justamente esse: se em algum momento
for preciso editar a CLI ou o MCP a mao para o criterio aparecer, a derivacao
tem um furo, e o furo e mais importante que o criterio.

### O dashboard e um caso a parte

O filtro da tela de priorizacao nao e o `TaskFilterCriteria`: e um campo de
texto que casa contra `id`, `type` e `title`. Entao ali o criterio nao chega
sozinho — precisa de um controle proprio, ao lado do seletor de modo de
ordenacao.

Ele combina bem com o que ja existe: os modos `diff-asc` e `diff-desc` ordenam
por dificuldade, e hoje as tarefas sem nota entram nessa ordenacao sem ter o que
ordenar. Ver so as pontuadas torna esses dois modos honestos.

### Nome

`difficulty` ja e o campo, e um criterio com o mesmo nome sugeriria filtrar por
**valor** (`--difficulty 3`), que e outra coisa e tambem util um dia. Para nao
queimar o nome, a proposta e `scored` — e, se houver par, `unscored`. A decisao
fica aberta.

### Decisoes (task-102)

- **Par `scored`/`unscored`.** Os dois usos estao na propria nota do caso de uso; nenhum dos dois e hipotetico.
- **No dashboard o controle e um `select` de tres estados** (`all`/`scored`/`unscored`), nao persistido — igual ao filtro de texto, e diferente de modo de visao/ordenacao, que sao preferencia de exibicao.
- Com `unscored` ligado, dar nota a uma tarefa a tira da tela: e o comportamento de fila que se queria.
