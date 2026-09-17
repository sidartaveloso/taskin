# 🧩 Task 076 — Documentar vocabulário de adiamento e evidência (TASKS/README + template do taskin new)

- Status: done
- Type: docs
- Assignee: Sidarta Veloso
- Priority: 280

## Description
Deriva da decisão em `decisoes/portao-de-conclusao-e-evidencia.md` (task-069),
perguntas 2 e 4. Sem o vocabulário documentado, o portão de T-074/T-075 recusa
casos legítimos e as pessoas não sabem como adiar um item.

## Tasks
- [x] Documentar no `TASKS/README.md`: `[x]` feito, `[ ]` aberto, `[ ] ... — adiado: <razão>` / `— deferred:` adiado, `~~...~~` descopado
- [x] Documentar a convenção de evidência (texto livre no item feito: nome de teste, comando, hash) e que "conferi manualmente" não é verificável
- [x] Deixar claro que razão vazia não conta como adiamento
- [x] Acrescentar uma linha de convenção no template do `taskin new` (`file-system-task-provider.ts:498`), mantendo o `## Tasks` leve

### O que comprova cada item

A secao **"Como marcar um item concluído"** no `TASKS/README.md`, com a tabela
das tres formas, a convencao de evidencia, o caso do adiamento e quem cobra o
que — o `finish` avisando e o `lint` recusando.

E uma linha no template do `taskin new`, onde a pessoa de fato a ve:

```
## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
```

**Por que uma linha, e nao um paragrafo:** o template e lido toda vez que alguem
cria uma tarefa, e texto longo ali vira ruido que se aprende a pular. O guia
carrega o detalhe; o template carrega o lembrete.

O README tambem registra **de onde a convencao veio** — a auditoria de 12 e
13/09, com quatro tarefas `done` e o checklist inteiro em aberto. Sem isso a
regra parece burocracia; com isso, parece o que e.

## Notes
Não introduzir modelo tipado/branded de critério de aceite — a decisão rejeita
isso (formulário → evidência falsa). A convenção fica leve e legível.
