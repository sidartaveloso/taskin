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
- [ ] A prova primeiro, em commit vermelho: na suíte do `scheduler`, uma conta com capacidade 1 e duas tasks no mesmo momento: o plano põe a segunda noutra conta ou noutro momento; `violations` acusa `concurrency` quando um plano passa da capacidade da conta; conta sem capacidade não limita
- [ ] `SchedulingAccess` ganha a capacidade opcional, vinda do `concurrencyLimit` do inventário (`PlanAccessInput` passa a carregá-lo)
- [ ] O guloso respeita a capacidade da conta junto com a da máquina
- [ ] `taskin plan` mostra a conta cheia como motivo de adiar (`concurrency`) quando é ela que segura a task

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

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
