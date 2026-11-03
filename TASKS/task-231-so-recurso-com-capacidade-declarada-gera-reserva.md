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

O desenho: escolher a conta e entregar o segredo vale para todo acesso (liberada para a sensibilidade do dado, com folga na cota, e entre as que sobram a menos ocupada, contada pelas execuções em aberto no registro de execuções: começou e não terminou). Ocupar uma vaga (reserva, com prazo e devolução) só existe quando a conta declara capacidade (`concurrencyLimit`; o mesmo conceito de `concurrency` das máquinas do escalonador). Sem capacidade declarada: nada é gravado, não há prazo, não há `shared`. Em português é "reserva"; no código segue `lease`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro: os casos de nível 1 (`situation.contract.ts`, `scenarios.ts`) e a suíte `access-broker.contract.ts` descrevem o novo comportamento e ficam vermelhos contra a implementação atual, em commit à parte
  - Prova: commit `test(situation): a prova de que so recurso com capacidade declarada gera reserva (vermelha)` (53 casos vermelhos antes da implementação); tipos novos `AccessGranted` e `LeaseGranted.reserved` em `flows.types.ts`, a porta `IOpenRunsPort` em `access-broker.types.ts`, e `FakeOpenRuns` em `system.fake-ports.ts`.
- [x] Conta sem limite atende N rodadas sem gravar reserva nem expirar; entre duas contas sem limite a rodada nova vai à com menos execuções em aberto no registro; conta com `concurrencyLimit` reserva, recusa quando cheia, divide e devolve; nenhum segredo gravado em disco
  - Prova: em `access-broker.contract.ts`: "conta sem capacidade declarada atende varias rodadas sem gravar reserva, e o tempo nao a tira de nenhuma", "entre duas contas sem capacidade declarada, a rodada nova vai a que tem menos execucoes em aberto no registro", "conta com capacidade declarada: a reserva ocupa uma vaga, com prazo...", "com a capacidade declarada e sem vaga, o pedido e negado com o motivo", "devolver libera a vaga...", "uma conta com capacidade para duas: a segunda execucao divide a conta"; em `access-broker.local.test.ts`: "conta sem capacidade declarada: nenhuma rodada grava reserva, nem o arquivo de estado nasce" e "o arquivo guarda o nome logico e os prazos da reserva, nunca o segredo"; no nível 1, os casos "o acesso entrega o segredo so no ambiente da execucao, sem reserva nem prazo..." e companhia.
- [x] O registro de execuções passa a dizer quais execuções estão em aberto (`openRuns`), e o `access-broker` as lê por uma porta, sem arquivo à parte
  - Prova: `IRunLedger.openRuns` (memória e local; o local grava o começo da execução em `.taskin/runs.jsonl`, com ids únicos entre processos, e deixa de contar a que ficou aberta mais de 24 h); casos "as execucoes em aberto sao as que comecaram e nao terminaram..." (contrato) e `run-ledger local: o arquivo de execucoes` (`local.test.ts`); o sistema liga `runs: runLedger` em `situation.memory.ts`.
- [x] `access-broker.memory.ts` e `access-broker.local.ts` verdes na mesma suíte, sem editar caso depois do commit vermelho
  - Prova: `pnpm --filter @opentask/taskin-situation test`. Única mudança na prova depois do commit vermelho: o gatilho do caso de ciclo de vida passou de `concurrencyLimit: 1` para `2` (o caso chama o gatilho duas vezes e espera dois eventos `lease-granted`; com 1 a segunda é negada).
- [x] `taskin access run` e `taskin access status` (e o e2e): "Using" quando não há reserva, "Reserved" quando há, "No accounts reserved"
  - Prova: `packages/cli/src/commands/access.ts` e `access.e2e.test.ts` (7 casos, incluindo o espalhamento pelo `runs.jsonl` e o SIGINT que devolve a reserva).
- [x] README da CLI, RDT, changeset e as tasks que falam em "empréstimo" passam a dizer "reserva"
  - Prova: `packages/cli/README.md` (entradas `taskin access run|status`), `docs/RDT/consciencia-situacional.md`, `.changeset/consciencia-situacional.md`, tasks 226, 227 e 228, e o nome do grupo `situacao-lote-6`. As tasks fechadas 216, 217, 218 e 221 ficam como estão: o histórico delas diz "empréstimo".

## Notes
### O que ficou da rodada
- A ocupação que ordena as contas é a das execuções em aberto no registro; para a conta com `concurrencyLimit` conta também a reserva que ainda não virou execução (o maior dos dois), para a rodada não dividir uma vaga enquanto a outra conta está parada.
- O `taskin access run` só consulta o registro: quem começa e fecha execuções é o sandcastle (task 227). Enquanto ninguém grava o começo da execução, conta sem limite escolhe pela folga na janela e, no empate, pela ordem da lista.
- A "folga na cota" segue como desempate (depois da ocupação), como antes; excluir a conta sem nenhuma cota restante pede um código de recusa novo e ficou fora.

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
