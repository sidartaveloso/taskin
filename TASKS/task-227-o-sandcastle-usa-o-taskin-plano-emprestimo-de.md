# 🧩 Task 227 — O sandcastle usa o taskin: plano, acesso à credencial e registro de execução

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-interativas
- Difficulty: 4
- Priority: 9720

## Description
O sandcastle passa a usar o que a consciência situacional já sabe: escolhe o modelo pelo `taskin plan` quando `SANDCASTLE_MODEL` não vem, pega a credencial pelo `taskin access run` (o que permite várias contas sem trocar o `.sandcastle/.env` à mão) e grava cada execução no registro, com a dificuldade estimada e a encontrada: o histórico do time vai ao `.taskin/runs.jsonl` (sem conta nem horário, com o modelo) e o resto (a conta, o começo e o consumo com horário) ao estado da máquina, tudo pelo `createLocalRunLedger` (task 232). Gravar o começo da execução, e não só o fim, é o que faz o `taskin access run` espalhar as rodadas pelas contas: a conta menos ocupada é a que tem menos execuções em aberto no estado da máquina (task 231).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O campo da dificuldade encontrada: onde o agente a registra ao fechar a task (proposta: `- Difficulty found:` no cabeçalho, ao lado de `Difficulty`), decidido com o usuário, com o provider e o lint acompanhando
- [ ] `.sandcastle/prompt.md` pede ao agente a dificuldade encontrada antes de fechar a task
- [ ] `.sandcastle/main.ts`: sem `SANDCASTLE_MODEL`, o modelo vem do `taskin plan --json` para a primeira task do lote; com a variável, ela vale, como hoje
- [ ] `.sandcastle/main.ts`: o token do agente vem do `taskin access run claude-code`, e não mais só do `.sandcastle/.env`
- [ ] Ao começar cada iteração, a execução começada pelo `createLocalRunLedger` (`startRun` com o acesso que o `taskin access run` escolheu), e, ao fim dela, a execução fechada com o modelo, os tokens, as iterações, a duração e a dificuldade estimada e encontrada (o `.taskin/runs.jsonl` leva só isso, sem a conta)
- [ ] Um lote pequeno rodado de verdade com isso, e o `taskin plan` seguinte já usando o histórico
- [ ] `docs/SANDCASTLE_LICOES.md` atualizado

## Notes
Depende das tasks 225 e 226 (lote 6).

### Onde executar
Interativo, fora do sandcastle: a task muda o próprio sandcastle, e o agente não testa a máquina em que roda. Testada numa máquina Linux com Docker nativo, a partir da `develop` atualizada.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
