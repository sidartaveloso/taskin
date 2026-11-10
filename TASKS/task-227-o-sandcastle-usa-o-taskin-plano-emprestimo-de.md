# 🧩 Task 227 — O sandcastle roda uma task a pedido do taskin run, com o modelo e a conta do plano

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-interativas
- Difficulty: 4
- Priority: 9720

## Description
O sandcastle passa a ser o comando que o `taskin run` (task-238) chama para cada task do plano. Hoje ele pega um lote, roda uma task por iteração com um modelo só e lê o token do `.sandcastle/.env`. O taskin não precisa usar um modelo por vez: o plano distribui as tasks entre modelos, contas e máquinas, e várias rodam ao mesmo tempo. Então o sandcastle roda **uma task** por chamada, com a task, o modelo e o token que o `taskin run` entrega no ambiente (`TASKIN_TASK`, `TASKIN_MODEL`, a variável do acesso), cada chamada no seu próprio worktree, para duas rodarem em paralelo sem se pisar. Ao fechar, escreve o resultado em `TASKIN_RUN_RESULT` (dificuldade encontrada, tokens, iterações, se concluiu, se refez), e o `taskin run` grava o registro: o histórico do time no `.taskin/runs.jsonl` (sem conta nem horário, com o modelo) e o resto no estado da máquina (task-232). O modo de lote de hoje continua para quem roda o sandcastle à mão.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O campo da dificuldade encontrada: onde o agente a registra ao fechar a task (proposta: `- Difficulty found:` no cabeçalho, ao lado de `Difficulty`), decidido com o usuário, com o provider e o lint acompanhando
- [ ] `.sandcastle/prompt.md` pede ao agente a dificuldade encontrada antes de fechar a task
- [ ] `.sandcastle/main.ts`: com `TASKIN_TASK`, roda só aquela task, com o modelo de `TASKIN_MODEL` e o token que veio no ambiente; sem ela, o lote de hoje, como está
- [ ] Cada chamada num worktree próprio e num container próprio, para duas tasks do mesmo repositório rodarem ao mesmo tempo; o merge do resultado segue a regra de hoje (no HEAD de onde o `taskin run` foi chamado), uma de cada vez
- [ ] O resultado em `TASKIN_RUN_RESULT`: tokens e iterações medidos pelo sandcastle, a dificuldade encontrada lida da task, se concluiu e se refez
- [ ] `resources.dispatch.command` deste repositório apontando para o sandcastle
- [ ] Um lote real pelo `taskin run`: duas tasks ao mesmo tempo em modelos diferentes, e o `taskin plan` seguinte já usando o histórico
- [ ] `docs/SANDCASTLE_LICOES.md` atualizado

## Notes
Depende da task-238 (o `taskin run`), que depende das tasks 235, 236 e 237.

### Onde executar
Interativo, fora do sandcastle: a task muda o próprio sandcastle, e o agente não testa a máquina em que roda. Testada numa máquina Linux com Docker nativo, a partir da `develop` atualizada.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
