# 🧩 Task 104 — O link para a propria task na notificacao, como capacidade do provider

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 1054
- Group: notificacoes

## Description
A notificacao cita o numero da task e nao leva a ela. Cada provider sabe onde a task vive: no file system ela e um arquivo versionado, e o endereco e o blob no forge na branch corrente; no Redmine, no Jira e no GitHub Issues ela ja tem URL propria. Entao isto e uma capacidade do ITaskProvider, opcional como o IGroupRegistry: quem sabe produzir o endereco implementa, e quem nao sabe simplesmente nao expoe, e o chamador descobre pela ausencia em vez de por uma chamada que devolve vazio.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Desenhar a capacidade opcional no `ITaskProvider`, no molde do `IGroupRegistry`
- [ ] Suite de contrato, para qualquer provider provar a implementacao contra os mesmos casos
- [ ] Implementar no provider de file system: blob do arquivo no forge, na branch corrente
- [ ] Usar o endereco na notificacao, quando houver
- [ ] Degradar sem ruido quando nao houver: o numero da task continua, so nao vira link
- [ ] Documentar a capacidade no guia de providers

## Notes

### Por que e do provider, e nao da notificacao

Cada provider sabe onde a task vive, e so ele sabe:

- **file system** — e um arquivo versionado; o endereco e o blob no forge, na
  branch corrente. Precisa do remoto e do caminho relativo a raiz do repositorio.
- **Redmine, Jira, GitHub Issues** — a task ja tem URL propria, devolvida pela
  API. Nao ha o que derivar.

Se a notificacao tentasse montar o endereco sozinha, ela precisaria saber de
qual provider veio a task e como cada um enderreca — a mesma copia a mao que
este repositorio ja combateu em outros lugares.

### Opcional, como o registro de grupos

A task-079 estabeleceu o molde: **um provider que nao tem a capacidade
simplesmente nao a expoe**, e quem chama descobre pela ausencia, e nao por uma
operacao que falha ou devolve vazio. O mesmo vale aqui — um provider em memoria,
ou um repositorio sem remoto, nao tem endereco para dar, e isso e um estado
normal.

### O que fica fora

A notificacao em si e a task-103, que reescreve a mensagem e resolve o link do
**commit**. Esta aqui e so o endereco da task, e as duas podem ser feitas em
qualquer ordem: a 103 entrega valor sem a 104, e a 104 sem a 103 nao tem onde
aparecer — entao a ordem util e 103 primeiro.
