# 🧩 Task 075 — Lint: task done com item de checklist em aberto sem justificativa é erro

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 270

## Description
Deriva da decisão em `decisoes/portao-de-conclusao-e-evidencia.md` (task-069),
pergunta 3. Reusa o leitor único de T-073 dentro do `task-validator.ts`. É a
checagem dura, que roda em CI e pega a falha auditada (`done` com zero itens
marcados) como build vermelho, sem tornar o `finish` frágil.

## Tasks
- [ ] No `task-validator.ts`, marcar erro quando a task está `done` e tem item em aberto sem justificativa
- [ ] Só agir sobre tarefas que têm `## Tasks` com itens — sem checklist, sem regra (não tocar as ~68 do acervo)
- [ ] Reusar o leitor de T-073 (nada de segundo parser de checklist)
- [ ] Mensagem de lint aponta a linha do item em aberto e sugere marcar `[x]` ou adiar com razão
- [ ] Testes: `done` com item aberto → erro; `done` com item adiado com razão → ok; task sem `## Tasks` → ok

## Notes
Combinação recomendada na decisão: aviso no `finish` (T-074), erro no lint (esta).
