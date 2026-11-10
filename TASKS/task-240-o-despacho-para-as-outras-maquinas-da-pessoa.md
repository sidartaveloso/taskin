# 🧩 Task 240 — O despacho para as outras maquinas da pessoa

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-interativas
- Priority: 9740
- Difficulty: 4
- Requires: interactive, docker

## Description
Com a percepção viva decidida (task-228), as máquinas de uma mesma pessoa sabem umas das outras. O `taskin run` passa a mandar uma atribuição do plano para outra máquina da pessoa: o notebook planeja, o desktop executa. Executar em outra máquina é execução remota de código, então só acontece com consentimento explícito, por máquina, e quem confirma e por qual canal sai das decisões da task-228.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O contrato do despacho remoto: pedir, aceitar ou recusar, acompanhar e fechar uma execução noutra máquina, em typestate, com a suíte
- [ ] O consentimento por máquina, na camada da pessoa: uma máquina só aceita despacho de outra que ela liberou
- [ ] O `taskin run` lança na outra máquina as atribuições dela, com a conta e o modelo do plano, e o registro de execuções de cada máquina guarda o que rodou nela
- [ ] O segredo da conta nunca atravessa a rede: a máquina remota usa a credencial da guarda dela
- [ ] Evidência: duas máquinas rodando tasks do mesmo plano ao mesmo tempo

## Notes
Depende da task-228 e da task-238.

### Contexto da rodada
- Ler: as decisões da task-228, `packages/cli/src/commands/daemon.ts`, o despacho local da task-238.
- Não ler: o `design-vue`.

### Verificacao
Mesma da task-238, mais a evidência com duas máquinas.

### Onde executar
Interativo, fora do sandcastle: precisa de duas máquinas da pessoa ligadas na mesma rede privada e de decisões dela no meio. A partir da `develop` atualizada.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
