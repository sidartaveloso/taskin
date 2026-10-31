# 🧩 Task 221 — Versão 2 dos casos de uso: pessoas como recurso e o pedido de ponto de vista

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-1
- Difficulty: 3
- Priority: 8950

## Description
Acrescenta aos casos aprovados na task-216, sem mudar nenhum deles, as pessoas como recurso do papel quem e o pedido de ponto de vista humano (design, circuito, texto) como fluxo em typestate. É a versão 2 do nível 1: só acréscimos, com a suíte nova vermelha contra o vazio, caso a caso.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Tipos marcados em `packages/situation/src/use-cases/branded.ts`: `ViewpointId` e `Expertise` (`design`, `electronics`, `writing`...), com construtor
- [ ] A pessoa declara, em `IDeveloperActor`, o consentimento para receber pedidos: as competências que aceita divulgar, a carga (pedidos por semana) e o horário. Sem consentimento, ela não é consultada
- [ ] `IReviewerActor`, um ator novo: aceitar, recusar com motivo e entregar o ponto de vista; e ver só os próprios pedidos e o próprio tempo de resposta
- [ ] `IExecutorActor.requestViewpoint`: pede pela competência, com a pergunta, o material e o prazo, e recebe `ViewpointRequested` ou a negativa com o motivo (`no-consenting-expert`, `over-capacity`, `only-the-author`)
- [ ] O fluxo em `packages/situation/src/use-cases/flows.types.ts`: `ViewpointRequested → ViewpointAccepted | ViewpointDeclined → ViewpointDelivered`, com `ViewpointExpired` no prazo
- [ ] A porta de presença e horário em `packages/situation/src/use-cases/ports.types.ts`, com a falsa em `fake-ports.ts`
- [ ] Os casos novos em `packages/situation/src/use-cases/situation.contract.ts`, depois dos aprovados: só quem consentiu é consultado; a carga declarada é respeitada; quem fez a task não revisa o próprio trabalho; fora do horário o pedido espera; pedido vencido no prazo; a resposta entregue fica registrada na execução da task; o tempo de resposta é visto só pela própria pessoa; gente de fora só entra por convite e só vê o material do pedido
- [ ] Prova negativa em `packages/situation/src/use-cases/flows.test-d.ts`: entregar sem aceitar; aceitar um pedido recusado ou vencido
- [ ] Os 21 casos aprovados continuam iguais: `git diff develop -- packages/situation/src/use-cases/situation.contract.ts` só mostra linhas acrescentadas depois deles
- [ ] A suíte inteira vermelha contra a implementação vazia, caso a caso, pelo motivo certo; a lista dos casos novos e da operação em que cada um para anotada aqui

## Notes
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
