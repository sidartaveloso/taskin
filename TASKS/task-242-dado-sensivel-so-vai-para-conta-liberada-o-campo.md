# 🧩 Task 242 — Dado sensivel so vai para conta liberada: o campo Sensitivity na task

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9680
- Difficulty: 3

## Description
`buildSchedulingProblem` fixa `sensitivity: 'public'` em toda task, e o `taskin run` não passa `--sensitivity` ao `taskin access run`: dado sensível pode ir para qualquer conta. A regra é que dado sensível só vai para um acesso considerado seguro para ele. A task ganha o campo `- Sensitivity: public|internal|sensitive`. Sem o campo vale o padrão do repositório, `resources.defaultSensitivity` no `.taskin.json`, e, sem padrão, `internal`, nunca `public`: esquecer o campo não pode abrir o dado para qualquer conta. Um valor que não se entende vale como `sensitive`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: task sensível nunca é atribuída a conta sem liberação; task sem o campo não vai para conta liberada só para `public`; o `taskin run` não lança e diz por quê
  - Prova: commit `test(task-242)` vermelho; `plan.test.ts` ("taskin plan: dado sensivel so vai para conta liberada"), `run.e2e.test.ts` ("task sem o campo, sem padrao e so com conta public: nao lanca nada e diz por que").
- [x] Schema em `packages/types-ts`, provider de arquivos (leitura nas duas línguas, escrita sem tocar no resto) e lint
  - Prova: `SENSITIVITIES`, `SensitivitySchema` e `parseSensitivity` em `packages/types-ts`; "sensitivity field" em `file-system-task-provider.test.ts`; "Sensitivity" em `file-system-task-linter.test.ts`.
- [x] O plano usa o valor da task, o padrão do repositório ou `internal`; a task sem conta liberada fica adiada com o código `data`
  - Prova: `DEFAULT_TASK_SENSITIVITY` e `buildSchedulingProblem`; `readDefaultSensitivity`; os casos de `plan.test.ts`.
- [x] O `taskin run` repassa o valor ao `taskin access run`, que recusa se a conta escolhida não cobre, e diz por que a task adiada não saiu
  - Prova: `--sensitivity` em `launch` e `deferredLines` em `run.ts`; `run.e2e.test.ts` ("task sensivel so sai para a conta liberada", "o access run recusa a conta que nao cobre").
- [x] `taskin access run` sem `--sensitivity`: vale o valor da task de `--task` ou o padrão do repositório, nunca `public`; com a flag, o mais restrito dos dois
  - Prova: `sensitivityOf` em `access.ts`; `access.e2e.test.ts` ("sem --sensitivity vale o padrao do repositorio", "com --task, vale a sensibilidade da task, e a flag nao a abre").
- [x] README da CLI, RDT, mapa e changeset
  - Prova: `packages/cli/README.md`, `docs/RDT/consciencia-situacional.md`, o mapa e `.changeset/consciencia-situacional.md`.

## Notes
Mesmo caminho do campo `Requires` (task-222).

### O que ficou da rodada
- Vai além do pedido: o `taskin access run` direto também deixou de ter `public` como padrão, e a flag não abre o que a task declara.
- Mudança de comportamento: conta sem `clearance` continua `public`, então um projeto sem `resources.defaultSensitivity` nem liberação tem as tasks adiadas com `data` até declarar um dos dois. É o que a regra pede, e o `taskin run` diz por quê.

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
