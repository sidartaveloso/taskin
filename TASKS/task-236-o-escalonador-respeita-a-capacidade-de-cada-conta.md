# 🧩 Task 236 — O escalonador respeita a capacidade de cada conta

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-7
- Priority: 9630
- Difficulty: 3
- Requires: docker

## Description
O `concurrencyLimit` de uma conta já vale para o access broker (task-231: a conta que declara capacidade é reservada e recusa quando cheia), mas o escalonador não o conhece: o plano pode pôr três execuções ao mesmo tempo numa conta que aceita duas, e o despacho seria recusado na hora. A capacidade da conta entra no problema do escalonador como a `concurrency` das máquinas: no máximo tantas execuções sobrepostas por conta quanto ela aceita, e conta sem capacidade declarada não tem teto.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: na suíte do `scheduler`, uma conta com capacidade 1 e duas tasks no mesmo momento: o plano põe a segunda noutra conta ou noutro momento; `violations` acusa `concurrency` quando um plano passa da capacidade da conta; conta sem capacidade não limita
  - Prova: commit vermelho `400bf3d6`; casos em `scheduler.contract.ts`: "uma conta nao roda ao mesmo tempo mais execucoes do que aceita", "conta sem capacidade declarada nao limita as execucoes sobrepostas", "com a conta cheia, a segunda task vai a outra conta ou a outro momento", "a conta cheia que segura a task interativa a adia por concurrency" (rodam em `src/memory/memory.test.ts`).
- [x] `SchedulingAccess` ganha a capacidade opcional, vinda do `concurrencyLimit` do inventário (`PlanAccessInput` passa a carregá-lo)
  - Prova: `SchedulingAccess.concurrencyLimit?` em `scheduler.types.ts`; `PlanAccessInput.concurrencyLimit?` em `plan/build-problem.ts`, preenchido por `local/plan.local.ts` a partir do `InventoryAccess`. Teste `plan.test.ts` › "a capacidade da conta vem do concurrencyLimit do inventario; sem ele, nao ha teto".
- [x] O guloso respeita a capacidade da conta junto com a da máquina
  - Prova: `violations` em `memory/scheduler.memory.ts` conta as execucoes por conta e momento (o molde da maquina) e acusa `concurrency`; o guloso so aceita candidatos sem violacao, entao respeita as duas capacidades. Casos do contrato acima.
- [x] `taskin plan` mostra a conta cheia como motivo de adiar (`concurrency`) quando é ela que segura a task
  - Prova: `plan/plan-report.ts` (`heldByAccountCapacity`): a task que so caberia depois do horizonte porque as contas estao cheias vai a `deferred` com `concurrency`; a maquina cheia continua em `beyondHorizon`. Testes `plan.test.ts` › "a conta cheia que segura a task aparece como motivo de adiar: concurrency" e "a maquina cheia continua levando a task para depois do horizonte". Comando: `pnpm --filter @opentask/taskin-situation test`.

## Notes
Depende da task-231. Pode correr junto da task-235, mas as duas mexem no `scheduler.memory.ts`: no mesmo lote, a 235 vem antes pela prioridade.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/scheduler/scheduler.types.ts`, `scheduler.contract.ts`, `packages/situation/src/memory/scheduler.memory.ts` (a restrição `concurrency` das máquinas é o molde), `packages/situation/src/plan/build-problem.ts`, `packages/situation/src/local/plan.local.ts`.
- Não ler: o access broker, a CLI além de `plan.ts`.
- Contrato antes do código: primeiro a prova (casos na suíte do plugin e, se o tipo muda, nos tipos), num commit vermelho; só depois a implementação, sem editar caso.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
```

### Onde executar
Sandcastle, lote `situacao-lote-7`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada, nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Nota da rodada: o guloso considera um momento por task, entao a capacidade da conta raramente adia por si so dentro do escalonador — ela empurra a task para mais tarde. Por isso o `taskin plan` traduz "empurrada para alem do horizonte so pela conta cheia" em adiamento `concurrency`; o contrato JSON nao mudou de forma (o mesmo `deferred`), entao `PLAN_REPORT_VERSION` ficou em 2.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
