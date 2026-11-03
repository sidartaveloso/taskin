# 🧩 Task 237 — O taskin access run segue a atribuicao do plano

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-7
- Priority: 9640
- Difficulty: 3
- Requires: docker

## Description
O `taskin access run` escolhe sozinho a conta menos ocupada. Com o plano, a conta e o modelo de cada task já foram decididos pelo escalonador, que distribui as tasks entre contas e modelos de propósito (uma task difícil no modelo forte, outra simples no barato, ao mesmo tempo). O `access run` passa a aceitar a conta e o modelo fixados: entrega aquela conta se ela estiver liberada para a sensibilidade e tiver vaga, e recusa com o motivo se não; a escolha pela menos ocupada fica para quando não há atribuição.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: na suíte do `access-broker`, o pedido com a conta fixada recebe aquela conta mesmo havendo outra menos ocupada; a conta fixada sem liberação para o dado é recusada com `no-cleared-access`; a fixada e cheia é recusada com `all-at-provider-limit`; a fixada que não existe para a pessoa é recusada com um código novo
  - Prova: commit vermelho `c314aed5`; casos em `packages/situation/src/system/plugins/access-broker/access-broker.contract.ts`, secao "A conta fixada pelo plano" (5 casos: fixada vence a menos ocupada, com e sem capacidade; `no-cleared-access`; `all-at-provider-limit`; `unknown-access`, tambem para a conta de outra pessoa). Roda em `pnpm --filter @opentask/taskin-situation test` (memoria e local).
- [x] `LeaseRequest` ganha a conta fixada opcional; o código novo de recusa entra em `LEASE_DENIAL_CODES`
  - Prova: `packages/situation/src/use-cases/flows.types.ts` (`LeaseRequest.access?: ResourceId`, `'unknown-access'` em `LEASE_DENIAL_CODES`); a escolha em `packages/situation/src/memory/access-broker.memory.ts` (`pick`: com a conta fixada so ela concorre).
- [x] `taskin access run --access <nome> [--model <modelo>]`: o nome lógico vira o id pelo inventário; o modelo vai ao comando na variável `TASKIN_MODEL`, para o agente usar o modelo que o plano escolheu
  - Prova: `packages/cli/src/commands/access.ts` (`--access`, `--model`, `MODEL_ENV_VAR`); o nome logico vira o id por `accessNames` (o inventario); um nome desconhecido vai como esta e o broker o recusa com `unknown-access`.
- [x] e2e: fixar a conta, recusar a fixada sem liberação, o `TASKIN_MODEL` no ambiente do comando
  - Prova: `packages/cli/src/commands/access.e2e.test.ts` — 'com --access, usa a conta que o plano fixou…', 'a conta fixada sem liberacao, ou que nao existe, e recusada…', 'com --model, o comando recebe o modelo do plano em TASKIN_MODEL…'. `pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts` (155 passam).
- [x] README da CLI
  - Prova: `packages/cli/README.md`, linha do `taskin access run`.

## Notes
Depende da task-231 e da task-232. A task-238 chama o `access run` com a conta e o modelo de cada atribuição.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/access-broker/` (tipos e suíte), `packages/situation/src/memory/access-broker.memory.ts`, `packages/situation/src/use-cases/flows.types.ts` (`LeaseRequest`, `LEASE_DENIAL_CODES`), `packages/cli/src/commands/access.ts` e `access.e2e.test.ts`.
- Não ler: o escalonador, o registro de execuções além da porta `IOpenRunsPort`.
- Contrato antes do código: primeiro a prova (casos na suíte do plugin e, se o tipo muda, nos tipos), num commit vermelho; só depois a implementação, sem editar caso.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
pnpm taskin lint
```

### Onde executar
Sandcastle, lote `situacao-lote-7`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada, nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
