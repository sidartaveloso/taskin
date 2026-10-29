# 🧩 Task 216 — Os casos de uso da consciência situacional: atores, fluxos, cenários e a suíte de contrato vermelha

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-ebwuvrd1

## Description
Nível 1 do método contrato antes do código: os atores, os fluxos em typestate, as portas, os cenários, a prova negativa e a suíte de contrato que falha contra a implementação vazia, caso a caso

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O pacote do sistema decidido e criado (proposta: `packages/situation`, `@opentask/taskin-situation`), com os tipos marcados por construtor que os casos usam (`AccessId`, `ResourceId`, `TokenCount`, `Instant`) e sem primitivo solto
- [ ] Atores, um contrato por papel e cada método uma história: `IDeveloperActor` (declara recurso, libera recurso pessoal para um repositório, pede o quadro), `ITeamActor` (oferece recurso, restringe classe de recurso, classifica um acesso por dados) e `IExecutorActor` (pede um acesso pelo tipo, registra a execução)
- [ ] Fluxos em typestate, com handles no particípio: `LeaseRequested → LeaseGranted → LeaseReturned | LeaseExpired` e `RunPlanned → RunStarted → RunFinished`, em que fechar exige a dificuldade encontrada
- [ ] Portas: relógio, gerenciador de segredos, sondagem da máquina e consumo informado pelo provedor
- [ ] Cenários: uma máquina e uma conta; duas máquinas e duas contas; duas máquinas e uma conta (o empréstimo divide a conta e a projeção mostra a janela acabando antes); repositório que restringe as máquinas pessoais
- [ ] Prova negativa em `*.test-d.ts`, com `@ts-expect-error`: devolver empréstimo não concedido; fechar execução sem a dificuldade encontrada; entregar task sensível a acesso que não a cobre
- [ ] A suíte de contrato, com jornadas de mais de um ator, falhando contra a implementação vazia, caso a caso e pelo motivo certo (a saída do vermelho anotada aqui)
- [ ] Revisão e aprovação dos casos pelo usuário antes de fechar: daqui em diante, mudar um caso é nova versão aprovada

## Notes
Nível 1 de "Como se implementa" em `docs/RDT/consciencia-situacional.md`. Quem implementa as próximas tasks não muda estes casos.

### Onde executar
Interativo, fora do sandcastle: é especificação, decidida com o usuário.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
