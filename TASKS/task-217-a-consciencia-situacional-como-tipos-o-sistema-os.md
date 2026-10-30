# 🧩 Task 217 — A consciência situacional como tipos: o sistema, os plugins e os eventos em envelope

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-1
- Difficulty: 4
- Priority: 9000

## Description
Nível 2 do método contrato antes do código: o sistema como tipos, sobre os casos de uso aprovados na task-216. `ISituation`, o contrato base de plugin, os sete plugins com os eventos em envelope e uma suíte de contrato por plugin, mais a suíte das jornadas que atravessam plugins. Tudo vermelho contra a implementação vazia, caso a caso.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `zod` como dependência do pacote, na mesma faixa do `@opentask/taskin-task-manager` (`^4.5.4`)
- [ ] `packages/situation/src/system/plugin.types.ts`: `PluginKey` (tipo marcado, kebab, com construtor) e `IPluginSituation<TEvents>` com `key`, `name`, `description`, `version`, `running`, `start`, `stop`, `on` e `off`
- [ ] `packages/situation/src/system/envelope.ts`: `Envelope<TType, TPayload>` (`id`, `type`, `occurredAt`, `source: { plugin, version }`, `payload`), `EnvelopesOf<TMap>` derivando a união de um mapa nome → payload, e `parseEnvelope`, que valida o envelope inteiro com Zod e devolve `{ ok: true, envelope }` ou `{ ok: false, issues }`, sem lançar; testado em `envelope.test.ts` (válido, tipo sem o prefixo do plugin, sem `id`, payload errado)
- [ ] Uma pasta por plugin em `packages/situation/src/system/plugins/<chave>/`, com `<chave>.types.ts` (a interface que estende `IPluginSituation` e o mapa de eventos), `<chave>.contract.ts` (`describe<Plugin>Contract(label, create)`) e `index.ts`, para: `inventory`, `probe`, `access-broker`, `run-ledger`, `scheduler`, `channels` e `flows`. Os eventos com o fato no passado (`access-broker:lease-granted`, `run-ledger:run-finished`, `probe:calibration-finished`...)
- [ ] `scheduler`: a função objetivo pura `scorePlan(plan, weights)` e `suggest(...)`, com os pesos λ e as restrições do RDT (cota, requisito fixo, custo de preparo do requisito móvel, competência, dados, dependências, concorrência, presença)
- [ ] `packages/situation/src/system/situation.types.ts`: `ISituation`, que agrega as operações dos plugins (sem `on`, `off`, `name` e `description` de cada um) e a união `SituationEvent`; `packages/situation/src/system/situation.contract.ts` com as jornadas que atravessam plugins
- [ ] A assinatura `ActorsOf = (situation: ISituation) => ISituationActors` em `packages/situation/src/system/actors-of.types.ts`: os atores do nível 1 viram vistas sobre o sistema. Cada porta do nível 1 coberta por um plugin, ou a lacuna anotada aqui
- [ ] `packages/situation/src/system/empty.ts` com a implementação vazia de cada plugin e `packages/situation/src/system/system.empty.test.ts`, em que cada caso de cada suíte falha com `NotImplementedError`
- [ ] `packages/situation/src/testing.ts` e o subpath `./testing` no `package.json`, exportando as suítes, as portas falsas e os cenários para os outros pacotes; o `index.ts` continua sem importar `vitest`
- [ ] Os plugins não se importam entre si: o que um precisa de outro é porta, e quem liga é o `ISituation` ou o `flows`

## Notes
Depende da task-216 (fechada). Nível 2 de "Como se implementa" em `docs/RDT/consciencia-situacional.md`.

Esta task escreve a especificação que os lotes seguintes implementam. O lote 1 só é mesclado na `develop` depois de o usuário revisar e aprovar os tipos e as suítes: essa aprovação é o portão do lote 2.

### Contexto da rodada
- Ler: em `docs/RDT/consciencia-situacional.md`, só as seções "Escalonamento" e "Como se implementa"; `packages/situation/src/use-cases/` inteiro (os casos aprovados); `padroes/estrutura-de-modulos.md`; o `package.json` do `packages/task-manager` (a faixa do `zod` e o subpath `./testing`).
- Não ler: a CLI, o `design-vue`, os servidores MCP e WebSocket.
- Não editar nada em `packages/situation/src/use-cases/`: os casos estão aprovados. Se um caso parecer errado, anotar aqui e seguir sem mudar.

### Verificacao
```bash
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation lint
pnpm --filter @opentask/taskin-situation test
```

### Onde executar
Sandcastle, lote `situacao-lote-1`, com o modelo mais forte (dificuldade 4: é especificação): `SANDCASTLE_GROUP=situacao-lote-1 SANDCASTLE_MODEL=claude-opus-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo (ou a reserva com VM). Depois do lote, revisão e aprovação no chat antes do merge.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
