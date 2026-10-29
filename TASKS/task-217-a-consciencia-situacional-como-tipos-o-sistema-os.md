# 🧩 Task 217 — A consciência situacional como tipos: o sistema, os plugins e os eventos em envelope

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: g-ebwuvrd1

## Description
Nível 2 do método: ISituation, IPluginSituation e os plugins de inventário, sondagem, empréstimo, registro de execução, escalonador, canais e fluxos, com os eventos em envelope e uma suíte de contrato por plugin

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `IPluginSituation<TEvents>`: chave (prefixo dos eventos, em kebab), nome, descrição, versão, `start`, `stop`, `running`, `on` e `off`
- [ ] O envelope `{ id, type, occurredAt, source: { plugin, version }, payload }`, com `type` em `'<plugin>:<fato-no-passado>'`, um mapa nome → payload por plugin como fonte única e o esquema Zod que valida o envelope inteiro na fronteira, devolvendo a falha como resultado
- [ ] Os plugins, cada um com seus tipos e sua `*.contract.test.ts`: `IInventory`, `IProbe`, `IAccessBroker`, `IRunLedger`, `IScheduler`, `IChannels` e `IFlows`
- [ ] `ISituation`, que agrega as operações dos plugins e a união dos eventos, com a suíte das jornadas que atravessam plugins
- [ ] Cada porta do nível 1 satisfeita por um plugin, ou a lacuna registrada aqui como mudança proposta
- [ ] Os plugins não se importam entre si: o que um precisa de outro é porta, e quem liga é o sistema ou o `IFlows`
- [ ] As suítes do nível 2 vermelhas contra a implementação vazia, caso a caso

## Notes
Depende da task-216. Nível 2 de "Como se implementa" em `docs/RDT/consciencia-situacional.md`.

### Onde executar
Interativo, fora do sandcastle: os tipos são a especificação que as implementações seguem.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
