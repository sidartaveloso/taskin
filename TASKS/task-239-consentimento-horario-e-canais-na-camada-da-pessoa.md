# 🧩 Task 239 — Consentimento, horario e canais na camada da pessoa

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-7
- Priority: 9660
- Difficulty: 3
- Requires: docker

## Description
O `people` e o `channels` existem só em memória: o consentimento para pedidos de ponto de vista, a carga semanal, o horário, os canais preferidos e os pedidos de cada pessoa somem quando o processo termina. Eles ganham implementação local, passando pelas mesmas suítes de contrato. O que é da pessoa (consentimento, carga, horário, presença, canais, como a TV da sala ou o relógio) mora na camada dela, fora do repositório; o que o RDT deixa versionar (quem é do projeto e a competência que a pessoa aceitou divulgar) fica no registro de pessoas.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `packages/situation/src/local/people.local.ts` e `channels.local.ts`, verdes nas suítes `people` e `channels` sem editar caso — `describePeopleContract('people local', …)` e `describeChannelsContract('channels local', …)` em `packages/situation/src/local/local.test.ts`; `pnpm --filter @opentask/taskin-situation test` (585 verdes). Nenhum caso nem suíte editados; `memory/people.memory.ts` e `channels.memory.ts` passaram a exportar a classe com o estado `protected` para a versão local estender
- [x] O que é da pessoa num arquivo da camada dela (proposta: chave `viewpoints` e `channels` em `~/.config/taskin/resources.json`, ao lado das contas), e o tempo de resposta no diretório de estado, visto só por ela — `local/personal-layer.ts` (seções `viewpoints`/`channels`); pedidos, convites e tempo de resposta em `viewpoints.json`, avisos em `notices.json`, no `taskinStateDir`, modo 0600. Testes `people e channels local: persistencia na camada da pessoa` (3 casos, incluindo `as contas, o consentimento e os canais dividem o resources.json sem um apagar o outro`; o `inventory.local.ts` agora lê só as listas e preserva as outras chaves)
- [x] Teste de privacidade: consentimento, horário, carga e nome de canal nunca aparecem em arquivo versionado — `privacidade: o que e da pessoa > consentimento, horario, carga e nome de canal nunca aparecem em arquivo versionado` em `local/local.test.ts` (varre todo arquivo do repositório de teste); na CLI, `viewpoints.e2e.test.ts` confere o mesmo sobre o repositório
- [x] `taskin viewpoints consent|withdraw|status`: a pessoa declara as competências, a carga semanal e o horário, e vê os pedidos abertos — `packages/cli/src/commands/viewpoints.ts`; `pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts src/commands/viewpoints.e2e.test.ts` (`consent grava competencias, carga e horario…`, `horario invalido e recusado…`)
- [x] `taskin channels prefer <canal...>` e `taskin channels status` — mesmo arquivo; e2e `prefer grava os canais na ordem, ao lado do consentimento; status mostra` e `sem canal declarado, status diz que o aviso nao chega`
- [x] README da CLI e RDT (a seção de pessoas e os nomes) — `packages/cli/README.md` (Commands, antes de `taskin run`); `docs/RDT/consciencia-situacional.md` (tabela `### Os nomes` e o parágrafo `Onde mora cada coisa (task-239)` em `### Pessoas também são recursos`)

## Notes
Um canal novo (a TV, o relógio) entra pelo mesmo contrato de canal; o transporte de um pedido de uma pessoa para o taskin de outra é da task-228.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/people/` e `channels/` (tipos e suítes), `packages/situation/src/memory/people.memory.ts` e `channels.memory.ts`, `packages/situation/src/local/inventory.local.ts` (o molde da camada da pessoa em arquivo), `packages/situation/src/local/local.test.ts`.
- Não ler: o escalonador, o access broker, o daemon.
- Não editar casos nem suítes de contrato.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
pnpm taskin lint
```

### Onde executar
Sandcastle, lote `situacao-lote-7`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada, nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

### Notas da execucao
- Fora do contexto da rodada, li `packages/cli/src/commands/access.ts`, `access.e2e.test.ts`, `register.ts`, `lib/probe-situation.ts` e `lib/run-ledger-files.ts` para montar os comandos novos da CLI (a lista não cobria a CLI), e `plan/scheduling-settings.ts`/`local/plan.local.ts` para conferir que as chaves novas do `resources.json` não quebram a leitura das contas.
- A CLI abre o `people` sem registro de pessoas nem presença (`members` vazio, presença desconhecida): consentir, retirar e ver os próprios pedidos não precisam deles; quem pede um ponto de vista (o sandcastle) é que liga o registro.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
