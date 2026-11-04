# 🧩 Task 242 — Dado sensivel so vai para conta liberada: o campo Sensitivity na task

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9680
- Difficulty: 3

## Description
`buildSchedulingProblem` fixa `sensitivity: 'public'` em toda task, e o `taskin run` não passa `--sensitivity` ao `taskin access run`: dado sensível pode ir para qualquer conta. A regra é que dado sensível só vai para um acesso considerado seguro para ele. A task ganha o campo `- Sensitivity: public|internal|sensitive`. Sem o campo vale o padrão do repositório, `resources.defaultSensitivity` no `.taskin.json`, e, sem padrão, `internal`, nunca `public`: esquecer o campo não pode abrir o dado para qualquer conta. Um valor que não se entende vale como `sensitive`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho: task sensível nunca é atribuída a conta sem liberação; task sem o campo não vai para conta liberada só para `public`; o `taskin run` não lança e diz por quê
- [ ] Schema em `packages/types-ts`, provider de arquivos (leitura nas duas línguas, escrita sem tocar no resto) e lint
- [ ] O plano usa o valor da task, o padrão do repositório ou `internal`; a task sem conta liberada fica adiada com o código `data`
- [ ] O `taskin run` repassa o valor ao `taskin access run`, que recusa se a conta escolhida não cobre, e diz por que a task adiada não saiu
- [ ] `taskin access run` sem `--sensitivity`: vale o valor da task de `--task` ou o padrão do repositório, nunca `public`; com a flag, o mais restrito dos dois
- [ ] README da CLI, RDT, mapa e changeset

## Notes
Mesmo caminho do campo `Requires` (task-222).

### Contexto da rodada
- Ler: `packages/situation/src/plan/build-problem.ts`, `packages/situation/src/local/plan.local.ts`, `packages/cli/src/lib/local-plan.ts`, `packages/cli/src/commands/run.ts` e `access.ts`, o commit da task-222 como molde.
- Não ler: o `design-vue`.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm taskin lint
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
```

### Onde executar
Interativo ou sandcastle, dentro do lote `situacao-lote-9`, antes da mescla na `develop`.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
