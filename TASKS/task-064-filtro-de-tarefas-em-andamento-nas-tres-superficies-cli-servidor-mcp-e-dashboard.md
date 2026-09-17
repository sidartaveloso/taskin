# 🧩 Task 064 — Filtro de tarefas em andamento nas tres superficies: CLI, servidor MCP e dashboard

- Status: done
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 890

## Description
Hoje so existe aberto e fechado. Aberto inclui pending, que nao esta sendo trabalhada, e fechado esconde tudo — falta o recorte do que comecou e ainda nao terminou. O dashboard nem filtro por status tem.

## Tasks
- [x] Definir `active` em `filterTasks`, com teste, junto de `open` e `closed`
- [x] CLI: `taskin list --active`
- [x] MCP: `active` no schema do `list_tasks`
- [x] Dashboard: `?filter=active` e `taskin dashboard --active`
- [x] Documentar nos READMEs e no site (os dois idiomas)
- [x] `pnpm lint`, `typecheck`, `test` e `build` verdes

### O que comprova cada item

4 testes novos em `filter-tasks.test.ts`, no bloco **filtro active**:

| o que se afirma | teste |
| --- | --- |
| traz in-progress, paused e in-review | `traz o que comecou e nao terminou` |
| `pending` fica de fora | `deixa pending de fora — nao comecou` |
| `blocked` fica de fora | `deixa blocked de fora, por decisao declarada` |
| e o meio que faltava | `e mais estreito que open e mais largo que in-progress` |

Exercitado de verdade: `taskin list --json --active` devolve 7 tarefas, todas
`in-progress` ou `paused`, e o `tools/list` do servidor MCP anuncia
`['active', 'assignee', 'closed', 'open', 'status', 'text', 'type']`.

### A task-071 pagou o investimento aqui

`active` entrou em **dois** lugares — o schema e o mapa de superficies de
`filter-criteria.ts` — e apareceu sozinho na flag da CLI e no schema JSON do
MCP. Antes seriam cinco edicoes, e esquecer uma nao quebraria nada.

O `satisfies Record<keyof TaskFilterCriteria, CriterionSurface>` faz o resto:
acrescentar um criterio sem declarar onde ele mora **nao compila**.

### O que fica declarado em aberto

**O dashboard ainda tem a regra copiada.** Ele reimplementa os conjuntos em
`App.vue` em vez de consumir `filterTasks`, porque importar `task-manager` dali
esbarra no build — o `.d.ts` do pacote leva o compilador ao `src`, e o `rootDir`
do dashboard recusa. A copia esta comentada no arquivo dizendo que e copia.

Enquanto isso nao for resolvido, mexer no conjunto `ATIVAS` exige mexer em dois
lugares. E a terceira superficie sobrevivendo a task-071, e merece task propria.

## Notes
**O que ja existe, para nao reimplementar.** Levantado antes de escrever esta
task:

| superficie | filtro por status exato | aberto / fechado | "em andamento" |
| --- | --- | --- | --- |
| `taskin list` | sim, `--status in-progress` | sim, `--open` / `--closed` | nao |
| `list_tasks` (MCP) | sim, `status: "in-progress"` | sim, `open` / `closed` | nao |
| dashboard | **nao** | sim, `?filter=open` / `closed` | nao |

Ou seja: o filtro **exato** por `in-progress` ja funciona na CLI e no MCP. O que
falta de verdade sao duas coisas diferentes, e vale nao confundi-las.

**A primeira: o dashboard nao tem filtro por status.** `App.vue` le o parametro
`filter` e so entende `open` e `closed`. Nao ha como pedir um status. A correcao
e o parametro passar a aceitar o mesmo vocabulario da CLI — qualquer status,
mais `open`, `closed` e `active` — em vez de ganhar um caso especial para
`in-progress`. Vocabulario unico e o que impede as tres superficies de
divergirem depois.

**A segunda: falta o recorte "em andamento", e ele nao e `in-progress`.** Hoje
so ha dois conjuntos, e nenhum serve para acompanhar trabalho:

```
EM_ABERTO  = pending, in-progress, paused, in-review, blocked
ENCERRADOS = done, canceled
```

`open` inclui `pending`, que e justamente o que ainda nao comecou — no board
isso e ruido. E `in-progress` sozinho e estreito demais: uma tarefa `paused` ou
`in-review` comecou e nao terminou, e sumir do painel quando alguem a pausa e
enganoso.

O conjunto proposto e **`active` = comecou e nao terminou**:

```
ACTIVE = in-progress, paused, in-review, blocked
```

Isto e, `EM_ABERTO` menos `pending`. **Decisao a confirmar antes de implementar:**
se `blocked` entra. Argumento a favor: bloqueada e trabalho comecado, e sumir do
painel esconde justamente o que precisa de atencao. Argumento contra: ninguem
esta trabalhando nela agora.

**Uma definicao, tres superficies.** O conjunto vive em
`packages/task-manager/src/filter-tasks/filter-tasks.ts`, ao lado de `EM_ABERTO`
e `ENCERRADOS`, e as tres superficies passam a chama-lo. Este e o ponto da task:
o padrao de defeito que mais apareceu neste repositorio e uma copia mantida a
mao daquilo que o codigo ja sabe — a documentacao prometendo seis ferramentas
quando existiam tres, a mesma lista reescrita no banner do `mcp-server`
esquecendo uma, tres implementacoes diferentes de filtro antes da task-059. Um
conjunto de status definido em tres lugares seria a proxima ocorrencia.

**TDD, pelas costuras que ja existem.** `filterTasks` e uma funcao pura com
teste proprio — e ali que o conjunto se afirma primeiro. A CLI tem o
`--json`, que da saida verificavel sem framing. O MCP tem `listTools()` e
`callTool` diretos. O dashboard tem o `App.vue` lendo `window.location.search`,
que o teste de componente consegue controlar.

**Nao criar sinonimo redundante.** `--in-progress` na CLI e no MCP seria um
apelido de `--status in-progress`, que ja existe: dois jeitos de dizer a mesma
coisa, que divergem quando um dos dois muda. `active` e um conceito novo e
merece nome; `in-progress` ja tem o seu.

**Motivacao.** Acompanhar pelo dashboard o que um agente autonomo esta
executando: o que interessa na tela e o que comecou e ainda nao terminou.
