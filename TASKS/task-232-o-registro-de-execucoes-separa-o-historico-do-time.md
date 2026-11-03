# 🧩 Task 232 — O registro de execucoes separa o historico do time do estado da maquina

- Status: in-progress
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
- [ ] A prova primeiro, em commit vermelho: o registro devolve só o que é do time (sem conta, sem horário, com o modelo); as execuções em aberto e o consumo vêm do estado da máquina; o teste de privacidade cobre uma conta da camada da pessoa
- [ ] O registro local em dois arquivos: `.taskin/runs.jsonl` (versionado) e `runs.jsonl` no diretório de estado (só da máquina)
- [ ] O id de uma conta é o mesmo em todos os repositórios da máquina (o estado da máquina vale para todos)
- [ ] `taskin plan`: taxa de conclusão e tokens por dificuldade por modelo (`model` em `resources.scheduling.accesses`, ou o tipo do acesso), consumo da janela do estado da máquina
- [ ] `taskin access`: a ocupação vem do estado da máquina
- [ ] RDT (a linha do registro versionado e a seção "O que pode ser versionado"), README da CLI e as tasks 219, 225, 226 e 227

## Notes
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
