# 🧩 Task 217 — A consciência situacional como tipos: o sistema, os plugins e os eventos em envelope

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-1
- Difficulty: 4
- Priority: 9000

## Description
Nível 2 do método contrato antes do código: o sistema como tipos, sobre os casos de uso aprovados na task-216. `ISituation`, o contrato base de plugin, os sete plugins com os eventos em envelope e uma suíte de contrato por plugin, mais a suíte das jornadas que atravessam plugins. Tudo vermelho contra a implementação vazia, caso a caso.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `zod` como dependência do pacote, na mesma faixa do `@opentask/taskin-task-manager` (`^4.5.4`) — `packages/situation/package.json` (`dependencies.zod`), `pnpm-lock.yaml` (resolveu 4.6.5)
- [x] `packages/situation/src/system/plugin.types.ts`: `PluginKey` (tipo marcado, kebab, com construtor) e `IPluginSituation<TEvents>` com `key`, `name`, `description`, `version`, `running`, `start`, `stop`, `on` e `off` — `PluginKey<K>` + `pluginKey()`, `PluginVersion` + `pluginVersion()`, `PluginOperations<P>`; os casos comuns a todo plugin (ciclo de vida, envelope, `off`, id proprio) em `system/plugin.contract.ts` (`lifecycleCases`)
- [x] `packages/situation/src/system/envelope.ts`: `Envelope<TType, TPayload>`, `EnvelopesOf<TMap>`, `EventCatalog<TMap>` e `parseEnvelope(catalog, input)` sem lancar — `system/envelope.test.ts`, verde: "devolve o envelope tipado quando tudo confere", "recusa o tipo que nao comeca pela chave do plugin", "recusa o envelope sem id", "recusa o payload que nao confere com o esquema do tipo", mais tipo desconhecido e entrada qualquer
- [x] Uma pasta por plugin em `packages/situation/src/system/plugins/<chave>/` com `<chave>.types.ts`, `<chave>.contract.ts` (`describe<Plugin>Contract(label, create)` e a lista `<PLUGIN>_CONTRACT_CASES`) e `index.ts`, para os oito: `inventory` (16 casos), `probe` (11), `access-broker` (19), `run-ledger` (12), `scheduler` (25), `channels` (13), `people` (16: competencia, consentimento, disponibilidade e os pedidos de ponto de vista da task-221) e `flows` (11). Eventos no passado: `access-broker:lease-granted`, `run-ledger:run-finished`, `probe:calibration-finished`, `people:viewpoint-delivered`... Teste "ha uma pasta por plugin" em `system/system.empty.test.ts`
- [x] `scheduler`: `scorePlan(plan, weights)` (pura, com os termos valor, dinheiro λ₁, preparo λ₂, retrabalho λ₃, interrupcoes λ₄ definidos em `PlanScore`), `violations(plan)` e `suggest(problem, weights)`, com as restricoes `quota` (com margem), `fixed-requirement`, `competence`, `data`, `dependency`, `concurrency`, `presence` e `unknown-reference`; o requisito movel e custo de preparo, pago uma vez por maquina — `system/plugins/scheduler/scheduler.types.ts`, casos em `scheduler.contract.ts`
- [x] `packages/situation/src/system/situation.types.ts`: `ISituation` com as operacoes de cada plugin (`PluginOperations<P>` tira `on`, `off`, `name`, `description`), `SituationEventMap`, `SituationEvent` e `SystemPorts`; `system/situation.contract.ts` com 12 jornadas (`SYSTEM_CONTRACT_CASES`, `describeSystemContract`): sondagem → quadro, emprestimo sobre o inventario, execucao inteira em ordem, nenhum segredo em envelope, pedido de ponto de vista → aviso pelo canal, entrega → registro de execucao, sistema parado nao liga nada
- [x] `ActorsOf = (situation: ISituation) => ISituationActors` em `system/actors-of.types.ts`, com `ACTOR_COVERAGE` (cada metodo de cada ator e cada porta do nivel 1 → plugin e operacoes, exaustivo pelo compilador: `system/system.test-d.ts`) e `ACTOR_GAPS` (as lacunas anotadas)
- [x] `packages/situation/src/system/empty.ts` (`createEmpty<Plugin>()` e `createEmptySystem`) e `system/system.empty.test.ts`: cada caso de cada suite e cada jornada falha com `NotImplementedError` — `pnpm --filter @opentask/taskin-situation test` (190 testes; 135 "falha por falta de implementacao")
- [x] `packages/situation/src/testing.ts` e o subpath `./testing` no `package.json`: suites dos dois niveis, portas falsas (`system/system.fake-ports.ts`: calibracao, envio de aviso, catalogo de acessos, fonte de eventos) e cenarios; o `index.ts` nao alcanca `vitest` (conferido percorrendo as importacoes a partir de `src/index.ts`: 29 arquivos, nenhum `vitest`)
- [x] Os plugins nao se importam entre si: teste "os plugins nao se importam entre si" em `system/system.empty.test.ts` (um caso por plugin, le os imports de cada arquivo); o `access-broker` le acessos pela porta `IAccessCatalogPort`, o `flows` escuta pela porta `IEventSourcePort`, e o `ISituation` liga tudo (as ligacoes estao no comentario de `ISituation`)
## Notes
Depende da task-216 (fechada) e da task-221, que roda antes no mesmo lote. Nível 2 de "Como se implementa" em `docs/RDT/consciencia-situacional.md`.

Esta task escreve a especificação que os lotes seguintes implementam. O lote 1 só é mesclado na `develop` depois de o usuário revisar e aprovar os tipos e as suítes: essa aprovação é o portão do lote 2.

### Contexto da rodada
- Ler: em `docs/RDT/consciencia-situacional.md`, só as seções "Escalonamento", "Pessoas também são recursos" e "Como se implementa"; `packages/situation/src/use-cases/` inteiro (os casos aprovados); `padroes/estrutura-de-modulos.md`; o `package.json` do `packages/task-manager` (a faixa do `zod` e o subpath `./testing`).
- Não ler: a CLI, o `design-vue`, os servidores MCP e WebSocket.
- Não editar nada em `packages/situation/src/use-cases/`: os casos estão aprovados. Se um caso parecer errado, anotar aqui e seguir sem mudar.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation lint
pnpm --filter @opentask/taskin-situation test
```

### Onde executar
Sandcastle, lote `situacao-lote-1`, com o modelo mais forte (dificuldade 4: é especificação): `SANDCASTLE_GROUP=situacao-lote-1 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo (ou a reserva com VM). Depois do lote, revisão e aprovação no chat antes do merge. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado, e uma branch antiga nem tem o lote.

#### O que se decidiu nesta rodada
- **Oito plugins, nao sete:** a descricao diz "os sete plugins", mas a lista tem oito (com `flows`); fiz os oito.
- **Chave = nome da pasta.** O RDT escreve `access:lease-granted` e `ledger:run-finished`; a task pede `access-broker:lease-granted` e `run-ledger:run-finished`. Segui a task: a chave do plugin e o nome da pasta. O RDT pode ser alinhado na revisao.
- **Operacoes funcionam parado; o ciclo de vida governa o que acontece sozinho:** so ligado o plugin emite, vence prazos e reage (caso "parado, o plugin nao emite").
- **O registro de execucao nunca ve o segredo:** `run-ledger.startRun(run, access: ResourceId)` recebe o id, nao o `LeaseGranted`; os eventos do `access-broker` levam o emprestimo sem `env` (prova negativa em `system.test-d.ts`).
- **Os eventos do `people` nao levam horario, carga, tempo de resposta nem o motivo de uma recusa**, pela regra "nada de placar de gente".
- **O catalogo Zod de cada plugin (`EventCatalog<XEvents>`) ficou para a implementacao:** `parseEnvelope` recebe o catalogo e o tipo `EventCatalog` obriga um esquema por evento do mapa; escrever os esquemas e trabalho do lote 2.
- **Cada suite e uma lista de casos mais o `describe<Plugin>Contract`**, como a do nivel 1, para que a prova contra a implementacao vazia percorra caso a caso.
- **Lacunas entre os niveis** (em `ACTOR_GAPS`): nenhum ator do nivel 1 pede o plano sugerido, calibra ou declara canais; e a execucao nao guarda a maquina em que rodou, nem no nivel 1. Nenhum caso em `use-cases/` foi mudado.
- **Ambiente:** `pnpm install` nao roda sem TTY neste container (quer recriar o `node_modules`). O lockfile foi atualizado com `pnpm install --lockfile-only` e o `zod` ligado a mao em `packages/situation/node_modules`; os comandos de verificacao rodaram com `--config.verify-deps-before-run=false`. Numa maquina com `pnpm install` normal isso nao e preciso.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
