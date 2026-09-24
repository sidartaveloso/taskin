# 🧩 Task 102 — Listar somente as tarefas que ja tem Difficulty definido

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 177
- Group: g-n1xf2yf7
- Difficulty: 2

## Description
Um criterio novo para restringir a listagem as tarefas que ja receberam dificuldade. O campo difficulty e opcional, de 1 a 5, e numa base em andamento convivem tarefas pontuadas e nao pontuadas; quem vai priorizar quer ver so as pontuadas, e quem vai pontuar quer justamente o contrario. O criterio entra no FilterCriteriaSchema do task-manager, que e a definicao unica: a flag da CLI, o schema JSON do list_tasks do MCP e a validacao saem dele, e o satisfies Record<keyof TaskFilterCriteria> impede esquecer alguma superficie. Na tela de priorizacao do dashboard entra como controle proprio, porque o filtro de la e de texto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Decidir o nome do criterio, e se ele tem par — ver a secao abaixo
- [ ] Acrescentar a propriedade ao `FilterCriteriaSchema` e a entrada em `FILTER_CRITERIA_SURFACES`
- [ ] Implementar o predicado no `filterTasks`, com teste: pontuada, nao pontuada, e o criterio ausente
- [ ] Conferir que a CLI e o `list_tasks` do MCP ganharam o criterio **sem edicao propria** — se precisarem, a derivacao esta furada
- [ ] Controle na tela de priorizacao do dashboard, separado do campo de texto
- [ ] Documentacao: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

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
