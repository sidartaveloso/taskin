# 🧩 Task 064 — Filtro de tarefas em andamento nas tres superficies: CLI, servidor MCP e dashboard

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

## Description
Hoje so existe aberto e fechado. Aberto inclui pending, que nao esta sendo trabalhada, e fechado esconde tudo — falta o recorte do que comecou e ainda nao terminou. O dashboard nem filtro por status tem.

## Tasks
- [ ] Definir `active` em `filterTasks`, com teste, junto de `open` e `closed`
- [ ] CLI: `taskin list --active`
- [ ] MCP: `active` no schema do `list_tasks` e no `criterioDe`
- [ ] Dashboard: o parametro `filter` passa a aceitar o mesmo vocabulario da CLI
- [ ] CLI: `taskin dashboard --active`
- [ ] Documentar nos READMEs, nos guias e no site (os dois idiomas)

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
