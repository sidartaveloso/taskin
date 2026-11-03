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
- [ ] A prova primeiro, em commit vermelho, com o despacho como função pura testável (plano, relógio, um lançador falso): lança só as atribuições desta máquina que já podem começar; nunca passa da `concurrency` da máquina nem da capacidade da conta; quando uma termina, replaneja e lança a próxima; uma task com dependência só sai depois que a dependência fechou
- [ ] O comando que roda cada task vem de `resources.dispatch.command` no `.taskin.json` (um modelo com `{task}`), recebendo `TASKIN_TASK`, `TASKIN_MODEL` e `TASKIN_RUN_RESULT`
- [ ] Cada execução é registrada pelo `createLocalRunLedger`: começa no estado da máquina, e fecha com o resultado que o comando escreve em `TASKIN_RUN_RESULT` (dificuldade encontrada, tokens, iterações, se concluiu, se refez)
- [ ] Sem resultado (o comando morreu ou não escreveu), a execução fecha só no estado da máquina, como abandonada, e nada vai ao histórico do time: `IRunLedger` ganha esse fechamento, com caso na suíte
- [ ] `taskin run --dry-run` mostra o que seria lançado agora, por máquina, conta e modelo, sem lançar nada
- [ ] Sinais: SIGINT encerra os filhos, devolve as reservas e fecha as execuções como abandonadas
- [ ] e2e com um comando de mentira que escreve o resultado: duas tasks em contas diferentes rodando ao mesmo tempo, o `.taskin/runs.jsonl` com duas linhas sem conta
- [ ] README da CLI e RDT (a etapa de despacho)

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
