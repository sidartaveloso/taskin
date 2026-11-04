# 🧩 Task 245 — O runs.jsonl versionado aguenta merge de varias maquinas

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9692
- Difficulty: 2

## Description
O `.taskin/runs.jsonl` é versionado, e várias máquinas acrescentam linhas no fim do mesmo arquivo: o merge conflita, porque o repositório não tem `.gitattributes`. O atributo `merge=union` resolve, mas pode deixar linhas repetidas ou fora de ordem, então a leitura precisa aguentar, sem contar a mesma execução duas vezes na calibração. O `taskin init` passa a declarar o mesmo atributo nos projetos novos.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: arquivo com linha repetida e fora de ordem não quebra a leitura, e a repetida não conta duas vezes na calibração; um merge real de dois ramos não conflita
  - Prova: commit `test(task-245)` vermelho; "depois de um merge..." em `local.test.ts`; "uma linha repetida pelo merge nao conta duas vezes na calibracao" em `plan.test.ts`; `runs-merge.e2e.test.ts` (merge real com o `.gitattributes` do repositório).
- [x] `.gitattributes` com `.taskin/runs.jsonl merge=union`
  - Prova: `.gitattributes`.
- [x] `runs()` lê uma vez cada `id` e ignora linha ilegível
  - Prova: `readLines` e `runs` em `run-ledger.local.ts`.
- [x] `taskin init` acrescenta o atributo, sem repetir nem apagar o que já há
  - Prova: `ensureRunsMergeAttribute` em `packages/cli/src/lib/git-attributes.ts`, chamado por `init.ts`; `git-attributes.test.ts`.
- [x] README da CLI e RDT
  - Prova: `packages/cli/README.md` e o RDT.

## Notes
Nada mais muda no `.taskin/runs.jsonl`.

### Contexto da rodada
- Ler: `packages/situation/src/local/run-ledger.local.ts`, `packages/cli/src/commands/init.ts`.
- Não ler: o escalonador, o `design-vue`.

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
