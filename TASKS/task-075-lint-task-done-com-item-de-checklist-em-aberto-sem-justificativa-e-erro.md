# 🧩 Task 075 — Lint: task done com item de checklist em aberto sem justificativa é erro

- Status: done
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 6651

## Description
Deriva da decisão em `decisoes/portao-de-conclusao-e-evidencia.md` (task-069),
pergunta 3. Reusa o leitor único de T-073 dentro do `task-validator.ts`. É a
checagem dura, que roda em CI e pega a falha auditada (`done` com zero itens
marcados) como build vermelho, sem tornar o `finish` frágil.

## Tasks
- [x] No `task-validator.ts`, marcar erro quando a task está `done` e tem item em aberto sem justificativa
- [x] Só agir sobre tarefas que têm `## Tasks` com itens — sem checklist, sem regra (não tocar as ~68 do acervo)
- [x] Reusar o leitor de T-073 (nada de segundo parser de checklist)
- [x] Mensagem de lint aponta a linha do item em aberto e sugere marcar `[x]` ou adiar com razão
- [x] Testes: `done` com item aberto → erro; `done` com item adiado com razão → ok; task sem `## Tasks` → ok

### O que comprova cada item

`validar-conclusao.test.ts` — 9 testes.

| o que se afirma | teste |
| --- | --- |
| so opina sobre encerrada | `nao opina sobre tarefa que ainda nao terminou` |
| item aberto e **erro** | `done com item em aberto e erro` |
| aponta a linha | `aponta a linha do item` |
| adiado com razao passa | `adiado com razao nao bloqueia` |
| adiado sem razao nao passa | `adiado sem razao bloqueia, porque nao e decisao declarada` |
| reclama de todos | `reclama de cada item em aberto, e nao so do primeiro` |
| `canceled` nao exige | `canceled tambem nao exige checklist marcado` |

**Um teste corrigiu o desenho.** A primeira versao tratava `done` e `canceled`
igual. Cancelada e **abandonada** — cobrar itens marcados ali seria absurdo,
porque ninguem cancela uma tarefa depois de termina-la. O teste pegou.

**Rodando neste repositorio, acusou 13 casos reais** — inclusive tres tarefas que
eu mesmo tinha acabado de fechar sem marcar, e duas cujos itens eu fechei em
prosa sem marcar a caixa. O portao cobrou de quem o escreveu antes de cobrar de
qualquer outro.

Nas tarefas antigas (003, 004, 012, 018), fechadas antes de o checklist fazer
parte do registro, os itens foram declarados como adiados com a razao verdadeira:
a evidencia nao e reconstruivel hoje. Marcar seria afirmar trabalho que nao
consigo verificar.

## Notes
Combinação recomendada na decisão: aviso no `finish` (T-074), erro no lint (esta).
