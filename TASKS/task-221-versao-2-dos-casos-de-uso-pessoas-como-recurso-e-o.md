# 🧩 Task 221 — Versão 2 dos casos de uso: pessoas como recurso e o pedido de ponto de vista

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-1
- Difficulty: 3
- Priority: 8950

## Description
Acrescenta aos casos aprovados na task-216, sem mudar nenhum deles, as pessoas como recurso do papel quem e o pedido de ponto de vista humano (design, circuito, texto) como fluxo em typestate. É a versão 2 do nível 1: só acréscimos, com a suíte nova vermelha contra o vazio, caso a caso.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Tipos marcados em `packages/situation/src/use-cases/branded.ts`: `ViewpointId` e `Expertise` (`design`, `electronics`, `writing`...), com construtor — `viewpointId()` (nao vazio) e `expertise()` (minusculas, sem espaco, como em `review:design`); a prova de que nao se confundem esta em `flows.test-d.ts` ("competencia como texto cru", "um pedido de emprestimo no lugar de um ponto de vista")
- [x] A pessoa declara, em `IDeveloperActor`, o consentimento para receber pedidos: as competências que aceita divulgar, a carga (pedidos por semana) e o horário. Sem consentimento, ela não é consultada — `consentToViewpoints(ViewpointConsent)` e `withdrawViewpointConsent()` em `actors.types.ts` (`ViewpointConsent`: `expertise`, `weeklyLoad`, `hours: WorkingHours`); provado pelo caso "so quem consentiu e consultado..."
- [x] `IReviewerActor`, um ator novo: aceitar, recusar com motivo e entregar o ponto de vista; e ver só os próprios pedidos e o próprio tempo de resposta — `actors.types.ts`: `requests()`, `accept`, `decline(request, reason)`, `deliver`, `responseTimes()`; `ISituationActors.reviewer(person)`
- [x] `IExecutorActor.requestViewpoint`: pede pela competência, com a pergunta, o material e o prazo, e recebe `ViewpointRequested` ou a negativa com o motivo (`no-consenting-expert`, `over-capacity`, `only-the-author`) — `requestViewpoint(run: RunPlanned | RunStarted, ask: ViewpointAsk)` e `followViewpoint(request)`; os motivos em `VIEWPOINT_DENIAL_CODES` (`flows.types.ts`)
- [x] O fluxo em `packages/situation/src/use-cases/flows.types.ts`: `ViewpointRequested → ViewpointAccepted | ViewpointDeclined → ViewpointDelivered`, com `ViewpointExpired` no prazo — secao "O pedido de ponto de vista humano", mais `ViewpointDenied` e a uniao `ViewpointState`
- [x] A porta de presença e horário em `packages/situation/src/use-cases/ports.types.ts`, com a falsa em `fake-ports.ts` — `IPresencePort.present(person)` / `FakePresence`; o horario vem do consentimento (`WorkingHours`). Acrescentei tambem `IPeopleRegistryPort.members(repository)` / `FakePeopleRegistry` (id e nome, o formato de um registro de `.taskin-users.json`, sem contato): sem ele nao ha como distinguir "gente de fora" de quem e do projeto
- [x] Os casos novos em `packages/situation/src/use-cases/situation.contract.ts`, depois dos aprovados: só quem consentiu é consultado; a carga declarada é respeitada; quem fez a task não revisa o próprio trabalho; fora do horário o pedido espera; pedido vencido no prazo; a resposta entregue fica registrada na execução da task; o tempo de resposta é visto só pela própria pessoa; gente de fora só entra por convite e só vê o material do pedido — os 8 casos sob "Versao 2"; o elenco (`carla`, `dora`, nomes inventados) e os ajudantes em `viewpoint-scenarios.ts`
- [x] Prova negativa em `packages/situation/src/use-cases/flows.test-d.ts`: entregar sem aceitar; aceitar um pedido recusado ou vencido — secao "ponto de vista", mais: recusar vencido, entregar duas vezes, pedir numa execucao fechada, competencia crua; conferido por `pnpm --filter @opentask/taskin-situation typecheck`
- [x] Os 21 casos aprovados continuam iguais: `git diff develop -- packages/situation/src/use-cases/situation.contract.ts` só mostra linhas acrescentadas depois deles — nenhuma linha `-` no diff; os casos novos entram antes do `];` do array, e o unico acrescimo fora deles e um `import` novo de `./viewpoint-scenarios` (as linhas de import existentes nao mudaram)
- [x] A suíte inteira vermelha contra a implementação vazia, caso a caso, pelo motivo certo; a lista dos casos novos e da operação em que cada um para anotada aqui — `pnpm --filter @opentask/taskin-situation test`: 31 testes em `situation.empty.test.ts` (29 casos + 2 de sanidade), todos com `NotImplementedError`:
  - so quem consentiu e consultado, e so na competencia que aceitou divulgar → `developer.consentToViewpoints`
  - a carga semanal que a pessoa declarou e respeitada → `developer.consentToViewpoints`
  - quem fez a task nao revisa o proprio trabalho → `developer.consentToViewpoints`
  - fora do horario, ou ausente, o pedido espera para chegar a pessoa → `developer.consentToViewpoints`
  - o pedido vence sozinho no prazo, e aceitar depois diz que venceu → `developer.consentToViewpoints`
  - o ponto de vista entregue fica registrado na execucao da task → `developer.consentToViewpoints`
  - o tempo de resposta e visto so pela propria pessoa, nunca como placar → `developer.consentToViewpoints`
  - gente de fora so entra por convite e so ve o material do pedido → `team.offer`

## Notes
Decisoes desta rodada (para a revisao do lote 1):
- O pedido nasce de uma execucao aberta (`RunPlanned | RunStarted`): e assim que a resposta fica registrada na execucao da task (`ViewpointDelivered.run`), e pedir numa execucao fechada nao compila. Os pontos de vista entregues se leem em `IDeveloperActor.viewpoints(repository, task)`.
- A autora do trabalho e a pessoa para quem o executor roda; a negativa `only-the-author` vale quando so ela consentiu naquela competencia.
- Fora do horario o pedido nao e negado: volta `requested` com `deliverableFrom` e so aparece em `IReviewerActor.requests()` quando a pessoa esta no horario e nao esta ausente pela porta de presenca.
- A carga semanal conta os pedidos dos ultimos sete dias.
- Convite e do time (`ITeamActor.invite`); o convidado ainda precisa consentir.
- Contra a implementacao vazia quase todos os casos novos param na primeira operacao, `consentToViewpoints`: o vermelho prova que o caso so falha por falta de implementacao, e as asserts de cada um so vao ser exercitadas pela implementacao da task-217 em diante.

Versão 2 dos casos de uso da task-216, que estão aprovados: esta task só acrescenta. A aprovação do usuário acontece na revisão do lote 1, junto com a task-217, antes do merge.

### Contexto da rodada
- Ler: `packages/situation/src/use-cases/` inteiro; em `docs/RDT/consciencia-situacional.md`, só a seção "Pessoas também são recursos"; no `.taskin/.taskin-users.json`, só o formato de um registro (não copiar nomes nem e-mails para os cenários).
- Não ler: a CLI, o `design-vue`, os outros pacotes.
- Cenários com nomes inventados, como os da task-216 (`ana`, `bruno`): nenhuma pessoa de verdade nos testes.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation lint
pnpm --filter @opentask/taskin-situation test
```

### Onde executar
Sandcastle, lote `situacao-lote-1`, antes da task-217 (dificuldade 3): `SANDCASTLE_GROUP=situacao-lote-1 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo. O lote 1 inteiro passa pela revisão do usuário antes do merge. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado, e uma branch antiga nem tem o lote.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
