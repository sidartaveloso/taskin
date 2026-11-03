# 🧩 Task 238 — O taskin run despacha o plano nesta maquina, varias tasks ao mesmo tempo

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-7
- Priority: 9650
- Difficulty: 4
- Requires: docker

## Description
O `taskin plan` só aconselha. Para o taskin distribuir de verdade, várias tasks precisam rodar ao mesmo tempo, cada uma com a conta, o modelo e a máquina que o plano escolheu. O `taskin run` faz isso nesta máquina: pega as atribuições do plano que caem aqui e já podem começar, lança em paralelo até a capacidade da máquina, cada uma pelo `access run` com a conta e o modelo fixados, registra as execuções e, quando uma termina, replaneja e lança a próxima. As atribuições de outras máquinas aparecem como esperando o despacho remoto (task-240).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho, com o despacho como função pura testável (plano, relógio, um lançador falso): lança só as atribuições desta máquina que já podem começar; nunca passa da `concurrency` da máquina nem da capacidade da conta; quando uma termina, replaneja e lança a próxima; uma task com dependência só sai depois que a dependência fechou
  - Commit vermelho `72ca436a`. `packages/situation/src/plan/dispatch.test.ts`: `decideDispatch` ("lanca so as atribuicoes desta maquina...", "nunca passa da concurrency da maquina...", "nunca passa da capacidade da conta...", "uma task com dependencia aberta nao sai...") e `dispatchPlan` ("...quando uma termina, replaneja e lanca a proxima", "uma task com dependencia so sai depois que a dependencia fechou", "...duas tasks vao a contas diferentes"), com `FakeClock` e lancador falso. Implementacao em `packages/situation/src/plan/dispatch.ts`; `PlanProblemInput.exclude` em `build-problem.ts` (caso "a task excluida nao e planejada, mas segura a que depende dela").
- [x] O comando que roda cada task vem de `resources.dispatch.command` no `.taskin.json` (um modelo com `{task}`), recebendo `TASKIN_TASK`, `TASKIN_MODEL` e `TASKIN_RUN_RESULT`
  - `packages/cli/src/commands/run.ts` (`dispatchCommandOf`, `launch`: `taskin access run <kind> --access <conta> --model <modelo> --task <id> -- sh -c <comando>`). e2e `run.e2e.test.ts` "duas tasks em contas diferentes..." confere `TASKIN_TASK`, `TASKIN_MODEL`, `TASKIN_RUN_RESULT` e o segredo no ambiente; "sem resources.dispatch.command, diz como declarar e nao lanca nada".
- [x] Cada execução é registrada pelo `createLocalRunLedger`: começa no estado da máquina, e fecha com o resultado que o comando escreve em `TASKIN_RUN_RESULT` (dificuldade encontrada, tokens, iterações, se concluiu, se refez)
  - `run.ts` `launch`: `planRun` → `startRun` antes do filho, `finishRun` com `runOutcomeFrom` (`dispatch.ts`, casos "runOutcomeFrom: ..."). e2e: duas linhas `started` e duas `finished` no estado da maquina.
- [x] Sem resultado (o comando morreu ou não escreveu), a execução fecha só no estado da máquina, como abandonada, e nada vai ao histórico do time: `IRunLedger` ganha esse fechamento, com caso na suíte
  - `IRunLedger.abandonRun` (`run-ledger.types.ts`, `RunAbandoned` em `flows.types.ts`), memoria e local (linha `abandoned` no estado da maquina). Suite: "a execucao sem resultado fecha como abandonada..." e "abandonar uma execucao vira evento, sem resultado" (memoria e local). e2e "o comando que nao escreve resultado fecha a execucao como abandonada, so no estado da maquina".
- [x] `taskin run --dry-run` mostra o que seria lançado agora, por máquina, conta e modelo, sem lançar nada
  - e2e "--dry-run mostra o que sairia agora, por maquina, conta e modelo, sem lancar nada" (`run.ts` `showDecision`).
- [x] Sinais: SIGINT encerra os filhos, devolve as reservas e fecha as execuções como abandonadas
  - e2e "SIGINT encerra os filhos, devolve as reservas e fecha as execucoes como abandonadas": sai com 130, `leases.json` sem reservas ativas, duas linhas `abandoned`, historico vazio. Caso puro "interrompido, nao lanca mais nada e espera o que ja roda".
- [x] e2e com um comando de mentira que escreve o resultado: duas tasks em contas diferentes rodando ao mesmo tempo, o `.taskin/runs.jsonl` com duas linhas sem conta
  - `packages/cli/src/commands/run.e2e.test.ts` "duas tasks em contas diferentes rodam ao mesmo tempo...": o comando falso so escreve o resultado depois de ver as duas tasks comecadas (senao sai com 3); `.taskin/runs.jsonl` com duas linhas, sem nome nem id de conta. `pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts`.
- [x] README da CLI e RDT (a etapa de despacho)
  - `packages/cli/README.md` (`taskin run [--dry-run]`); `docs/RDT/consciencia-situacional.md`, secao "O despacho nesta máquina".

## Notes
Depende da task-235, da task-236 e da task-237. A task-227 adapta o sandcastle para ser o comando que o `taskin run` chama.
Executar em outra máquina é a task-240, depois da task-228.

### Contexto da rodada
- Ler: `packages/situation/src/plan/` (o plano e o relatório), `packages/situation/src/local/run-ledger.local.ts`, `packages/situation/src/system/plugins/run-ledger/` (tipos e suíte), `packages/cli/src/commands/plan.ts`, `access.ts` (o `runChild` e o repasse de sinais são o molde), `packages/cli/src/lib/run-ledger-files.ts`.
- Não ler: o daemon, o taskinboard, o `design-vue`.
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
