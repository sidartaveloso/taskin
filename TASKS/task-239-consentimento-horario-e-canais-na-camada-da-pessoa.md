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
- [ ] `packages/situation/src/local/people.local.ts` e `channels.local.ts`, verdes nas suítes `people` e `channels` sem editar caso
- [ ] O que é da pessoa num arquivo da camada dela (proposta: chave `viewpoints` e `channels` em `~/.config/taskin/resources.json`, ao lado das contas), e o tempo de resposta no diretório de estado, visto só por ela
- [ ] Teste de privacidade: consentimento, horário, carga e nome de canal nunca aparecem em arquivo versionado
- [ ] `taskin viewpoints consent|withdraw|status`: a pessoa declara as competências, a carga semanal e o horário, e vê os pedidos abertos
- [ ] `taskin channels prefer <canal...>` e `taskin channels status`
- [ ] README da CLI e RDT (a seção de pessoas e os nomes)

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

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
