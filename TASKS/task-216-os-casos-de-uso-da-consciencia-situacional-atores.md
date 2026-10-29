# 🧩 Task 216 — Os casos de uso da consciência situacional: atores, fluxos, cenários e a suíte de contrato vermelha

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-ebwuvrd1

## Description
Nível 1 do método contrato antes do código: os atores, os fluxos em typestate, as portas, os cenários, a prova negativa e a suíte de contrato que falha contra a implementação vazia, caso a caso

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O pacote do sistema decidido e criado (proposta: `packages/situation`, `@opentask/taskin-situation`), com os tipos marcados por construtor que os casos usam (`AccessId`, `ResourceId`, `TokenCount`, `Instant`) e sem primitivo solto — evidência: `packages/situation` (privado, versão 0.0.0, no `tsconfig.json` da raiz e nos `paths`); `packages/situation/src/use-cases/branded.ts`. O acesso é um recurso, então leva `ResourceId`, e não um `AccessId` à parte
- [x] Atores, um contrato por papel e cada método uma história: `IDeveloperActor` (declara recurso, libera recurso pessoal para um repositório, pede o quadro), `ITeamActor` (oferece recurso, restringe classe de recurso, classifica um acesso por dados) e `IExecutorActor` (pede um acesso pelo tipo, registra a execução) — evidência: `packages/situation/src/use-cases/actors.types.ts`, com `ISituationActors` e `CreateSituation`: a implementação nasce só das portas
- [x] Fluxos em typestate, com handles no particípio: `LeaseGranted | LeaseDenied → LeaseReturned | LeaseExpired` e `RunPlanned → RunStarted → RunFinished`, em que fechar exige a dificuldade encontrada — evidência: `packages/situation/src/use-cases/flows.types.ts`. Mudou da proposta: o pedido é entrada, não estado (`LeaseRequested` saiu), porque ele já volta concedido ou negado com o motivo
- [x] Portas: relógio, gerenciador de segredos, sondagem da máquina e consumo informado pelo provedor — evidência: `packages/situation/src/use-cases/ports.types.ts`, com os prazos do empréstimo e dos fatos em `SituationSettings`; as portas falsas em `packages/situation/src/use-cases/fake-ports.ts`
- [x] Cenários: uma máquina e uma conta; duas máquinas e duas contas; duas máquinas e uma conta (o empréstimo divide a conta e a projeção mostra a janela acabando antes); repositório que restringe as máquinas pessoais — evidência: `packages/situation/src/use-cases/scenarios.ts`, com nomes inventados (`repo-a`, `ana`, `bruno`, `servidor-1`, `conta-a`)
- [x] Prova negativa em `*.test-d.ts`, com `@ts-expect-error`: devolver empréstimo não concedido; fechar execução sem a dificuldade encontrada; entregar task sensível a acesso que não a cobre — evidência: `packages/situation/src/use-cases/flows.test-d.ts`, 13 caminhos proibidos (devolver negado, devolvido ou vencido; começar com negado; fechar sem começar ou sem a dificuldade encontrada; começar de novo ou depois de fechado; primitivo solto e tipo trocado), conferidos pelo `pnpm --filter @opentask/taskin-situation typecheck`. A task sensível depende de dados, não de tipos: virou caso da suíte (`no-cleared-access`)
- [x] A suíte de contrato, com jornadas de mais de um ator, falhando contra a implementação vazia, caso a caso e pelo motivo certo (a saída do vermelho anotada aqui) — evidência: `packages/situation/src/use-cases/situation.contract.ts` (21 casos e `describeSituationContract` para as implementações) e `packages/situation/src/use-cases/situation.empty.test.ts`, em que cada caso falha com `NotImplementedError`; a saída está em "Vermelho contra o vazio", abaixo
- [ ] Revisão e aprovação dos casos pelo usuário antes de fechar: daqui em diante, mudar um caso é nova versão aprovada

## Notes
Nível 1 de "Como se implementa" em `docs/RDT/consciencia-situacional.md`. Quem implementa as próximas tasks não muda estes casos.

### Vermelho contra o vazio
Cada caso, a primeira operação que ele chama e que ainda não existe:
```
nao implementado: team.offer :: a pessoa ve a camada do repositorio somada a dela
nao implementado: developer.declare :: um recurso pessoal sem liberacao nao aparece no repositorio
nao implementado: developer.declare :: o recurso pessoal de uma pessoa nao aparece no quadro de outra
nao implementado: team.offer :: a restricao do repositorio tira a maquina pessoal, mesmo liberada
nao implementado: team.offer :: um acesso do repositorio sem a credencial da pessoa continua no quadro, indisponivel e com o motivo
nao implementado: developer.declare :: o quadro nunca leva o valor de um segredo
nao implementado: developer.declare :: um fato sondado traz quando foi visto, e expira depois do prazo
nao implementado: developer.declare :: uma maquina que nao responde a sondagem fica indisponivel, com o motivo
nao implementado: developer.declare :: o emprestimo entrega o segredo so no ambiente da execucao
nao implementado: developer.declare :: duas maquinas e duas contas: cada execucao recebe uma conta, sem dividir
nao implementado: developer.declare :: duas maquinas e uma conta: a segunda execucao divide a conta
nao implementado: developer.declare :: o emprestimo prefere a conta com mais folga na janela
nao implementado: developer.declare :: com o limite do provedor declarado e sem vaga, o pedido e negado com o motivo
nao implementado: developer.declare :: devolver libera a conta: a proxima execucao a recebe sem dividir
nao implementado: developer.declare :: emprestimo vencido libera a conta sozinho, e devolver depois diz que venceu
nao implementado: developer.declare :: task sensivel so recebe acesso liberado para dado sensivel
nao implementado: developer.declare :: sem acesso liberado para a sensibilidade, o pedido e negado com o motivo
nao implementado: developer.declare :: pedir um tipo de acesso que ninguem oferece e negado com o motivo
nao implementado: team.offer :: uma conta do repositorio so e emprestada a quem tem a credencial dela
nao implementado: developer.declare :: a execucao guarda a dificuldade estimada e a encontrada, o consumo e a duracao
nao implementado: developer.declare :: o registro de execucao cita o acesso pelo nome logico, nunca pelo segredo
```

### Onde executar
Interativo, fora do sandcastle: é especificação, decidida com o usuário.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
