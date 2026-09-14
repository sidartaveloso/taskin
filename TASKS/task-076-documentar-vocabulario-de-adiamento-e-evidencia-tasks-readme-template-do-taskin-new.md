# 🧩 Task 076 — Documentar vocabulário de adiamento e evidência (TASKS/README + template do taskin new)

- Status: pending
- Type: docs
- Assignee: Sidarta Veloso

## Description
Deriva da decisão em `decisoes/portao-de-conclusao-e-evidencia.md` (task-069),
perguntas 2 e 4. Sem o vocabulário documentado, o portão de T-074/T-075 recusa
casos legítimos e as pessoas não sabem como adiar um item.

## Tasks
- [ ] Documentar no `TASKS/README.md`: `[x]` feito, `[ ]` aberto, `[ ] ... — adiado: <razão>` / `— deferred:` adiado, `~~...~~` descopado
- [ ] Documentar a convenção de evidência (texto livre no item feito: nome de teste, comando, hash) e que "conferi manualmente" não é verificável
- [ ] Deixar claro que razão vazia não conta como adiamento
- [ ] Acrescentar uma linha de convenção no template do `taskin new` (`file-system-task-provider.ts:498`), mantendo o `## Tasks` leve

## Notes
Não introduzir modelo tipado/branded de critério de aceite — a decisão rejeita
isso (formulário → evidência falsa). A convenção fica leve e legível.
