# 🧩 Task 232 — O registro de execucoes separa o historico do time do estado da maquina

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-6
- Priority: 9612
- Difficulty: 4
- Requires: docker

## Description
O `.taskin/runs.jsonl` é versionado (o histórico do time vale em todas as máquinas), mas cada linha grava o nome lógico da conta e o horário exato de cada execução. Uma conta da camada da pessoa (`~/.config/taskin/resources.json`) tem o nome que a pessoa escolheu, e isso contradiz a regra do RDT de que a camada da pessoa nunca entra no repositório; os horários mostram quando a pessoa trabalha.

A separação: no repositório, em `.taskin/runs.jsonl`, só execuções fechadas e só o que serve ao time para calibrar (id, repositório, task, dificuldade estimada e encontrada, o modelo, tokens, iterações, se concluiu, se refez e a duração), sem conta e sem horário do dia. Na máquina, no diretório de estado (`$XDG_STATE_HOME/taskin`, o mesmo do `leases.json`), valendo para todos os repositórios dela: qual conta cada execução usou, o começo das execuções (as em aberto, com o corte de 24 h) e o consumo de cada conta com o horário, para a janela de cota. A taxa de conclusão e os tokens por dificuldade do `taskin plan` vêm do versionado, por modelo; o consumo da janela e as execuções em aberto vêm do estado da máquina.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: o registro devolve só o que é do time (sem conta, sem horário, com o modelo); as execuções em aberto e o consumo vêm do estado da máquina; o teste de privacidade cobre uma conta da camada da pessoa
  - Prova: commit `test(situation): a prova de que o historico versionado nao leva conta nem horario (vermelha)` (33 casos vermelhos); `RunRecord`, `OpenRun` e `RunOutcome.model` em `flows.types.ts`; casos "o historico do time leva o modelo e o que calibra, e nunca a conta nem um horario" e "o consumo de um acesso soma as execucoes fechadas nele em todos os repositorios da maquina" (`run-ledger.contract.ts`); `privacidade` em `local.test.ts` com a conta `claude-conta-pessoal-da-ana` e sem número de 10 dígitos no arquivo versionado.
- [x] O registro local em dois arquivos: `.taskin/runs.jsonl` (versionado) e `runs.jsonl` no diretório de estado (só da máquina)
  - Prova: `createLocalRunLedger(ports, { history, machine })` em `run-ledger.local.ts`; "o arquivo versionado leva so o que calibra; a conta e os horarios ficam no estado da maquina" e "o estado da maquina vale para todos os repositorios..." em `local.test.ts`.
- [x] O id de uma conta é o mesmo em todos os repositórios da máquina (o estado da máquina vale para todos)
  - Prova: `LocalInventory.idFor` (`personal:<dona>:<nome>` e `repository:<repositório>:<nome>`) e "a conta da camada da pessoa tem o mesmo id em repositorios diferentes..." em `local.test.ts`. O padrão em memória segue `resource-N`.
- [x] `taskin plan`: taxa de conclusão e tokens por dificuldade por modelo (`model` em `resources.scheduling.accesses`, ou o tipo do acesso), consumo da janela do estado da máquina
  - Prova: `modelOf` e `spent` em `build-problem.ts`, `localPlanResources` com o relógio; `plan.test.ts` ("duas contas do mesmo modelo dividem a taxa de conclusao...", "sem modelo declarado, o historico vale pelo tipo do acesso", "o consumo da janela vem do estado da maquina, nao do historico do time") e o e2e "o historico do time calibra por modelo e o consumo da cota vem do estado da maquina".
- [x] `taskin access`: a ocupação vem do estado da máquina
  - Prova: `runLedgerFiles` em `packages/cli/src/lib/run-ledger-files.ts`; e2e "entre duas contas sem capacidade declarada, a rodada vai a que tem menos execucoes em aberto no estado da maquina" (e `.taskin/runs.jsonl` não nasce).
- [x] RDT (a linha do registro versionado e a seção "O que pode ser versionado"), README da CLI e as tasks 219, 225, 226 e 227
  - Prova: `docs/RDT/consciencia-situacional.md`, `packages/cli/README.md`, `.changeset/consciencia-situacional.md` e as tasks 219, 225, 226, 227 e 231.

## Notes
### O que ficou da rodada
- Os eventos do `run-ledger` (`run-finished`) seguem levando o `RunFinished` inteiro, com a conta e os horários: eles vivem só dentro do processo e nunca são gravados em arquivo versionado.
- Não há migração: nenhum `runs.jsonl` tinha sido commitado.
- A execução que `taskin access run` escolhe continua sem registro próprio: quem começa e fecha execuções é o sandcastle (task 227), agora pelo mesmo `createLocalRunLedger`.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/run-ledger/`, `packages/situation/src/local/run-ledger.local.ts`, `packages/situation/src/local/plan.local.ts`, `packages/situation/src/plan/build-problem.ts`, `packages/cli/src/commands/plan.ts` e `access.ts`.
- Não ler: o escalonador, o `design-vue`.
- Contrato antes do código: o commit com a prova vermelha vem antes da mudança.

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
