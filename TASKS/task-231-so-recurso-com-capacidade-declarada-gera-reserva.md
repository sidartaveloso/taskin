# 🧩 Task 231 — So recurso com capacidade declarada gera reserva no access broker

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-6
- Priority: 9611
- Difficulty: 4
- Requires: docker

## Description
O access broker do `@opentask/taskin-situation` grava uma reserva com prazo para toda rodada, mesmo quando a conta não declara `concurrencyLimit`. Uma LLM que aceita várias sessões não precisa de reserva: o registro sem limite só servia para espalhar rodadas entre contas, e o prazo fixo faz uma rodada longa perder a conta no meio. Nem todo recurso precisa de reserva.

O desenho: escolher a conta e entregar o segredo vale para todo acesso (liberada para a sensibilidade do dado, com folga na cota, e entre as que sobram a menos ocupada, contada pelas execuções em aberto no registro de execuções: começou e não terminou). Ocupar uma vaga (reserva, com prazo e devolução) só existe quando o conta declara capacidade (`concurrencyLimit`; o mesmo conceito de `concurrency` das máquinas do escalonador). Sem capacidade declarada: nada é gravado, não há prazo, não há `shared`. Em português é "reserva"; no código segue `lease`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro: os casos de nível 1 (`situation.contract.ts`, `scenarios.ts`) e a suíte `access-broker.contract.ts` descrevem o novo comportamento e ficam vermelhos contra a implementação atual, em commit à parte
- [ ] Conta sem limite atende N rodadas sem gravar reserva nem expirar; entre duas contas sem limite a rodada nova vai à com menos execuções em aberto no registro; conta com `concurrencyLimit` reserva, recusa quando cheia, divide e devolve; nenhum segredo gravado em disco
- [ ] O registro de execuções passa a dizer quais execuções estão em aberto (`openRuns`), e o `access-broker` as lê por uma porta, sem arquivo à parte
- [ ] `access-broker.memory.ts` e `access-broker.local.ts` verdes na mesma suíte, sem editar caso depois do commit vermelho
- [ ] `taskin access run` e `taskin access status` (e o e2e): "Using" quando não há reserva, "Reserved" quando há, "No accounts reserved"
- [ ] README da CLI, RDT, changeset e as tasks que falam em "empréstimo" passam a dizer "reserva"

## Notes
### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/access-broker/`, `packages/situation/src/memory/access-broker.memory.ts`, `packages/situation/src/local/access-broker.local.ts`, `packages/situation/src/system/plugins/run-ledger/`, `packages/situation/src/local/run-ledger.local.ts`, `packages/cli/src/commands/access.ts`.
- Não ler: o escalonador, o `design-vue`.
- Contrato antes do código: o commit com a prova vermelha vem antes da mudança na memória, no local e na CLI.

### Verificacao
```bash
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=taskin...
pnpm taskin lint
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
```

### Onde executar
Sandcastle ou interativo, dentro do lote `situacao-lote-6`, antes da mescla do lote. Sempre a partir de um clone na `develop` atualizada, nunca de uma branch de task.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
