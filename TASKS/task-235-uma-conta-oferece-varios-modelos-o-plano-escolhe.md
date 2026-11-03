# 🧩 Task 235 — Uma conta oferece varios modelos: o plano escolhe conta, modelo e maquina para cada task

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-7
- Priority: 9620
- Difficulty: 4
- Requires: docker

## Description
Hoje cada conta declara um modelo só (`model` em `resources.scheduling.accesses` ou no `scheduling` da conta pessoal), e o escalonador trata conta e modelo como a mesma coisa. Uma assinatura costuma oferecer vários modelos ao mesmo tempo (um forte e caro, um rápido e barato), e o taskin não precisa usar um modelo por vez: ele distribui as tasks entre modelos, contas e máquinas. Uma conta passa a oferecer uma lista de modelos, cada um com competência, custo e taxa de conclusão declarada, todos dividindo a cota e a janela da conta. O escalonador atribui a cada task a conta, o modelo e a máquina, e o plano diz o modelo de cada atribuição.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho: na suíte do `scheduler`, uma conta com dois modelos recebe duas tasks de dificuldades diferentes, cada uma no modelo que a cobre pelo menor custo; a soma dos tokens dos modelos de uma conta não passa da cota dela; a atribuição traz o modelo
- [ ] `SchedulingAccess` ganha a lista de modelos (ou o problema ganha a oferta conta × modelo), e `Assignment` ganha `model`; a cota é da conta, não do modelo
- [ ] `resources.scheduling.accesses.<conta>.models` no `.taskin.json` e `models` no `scheduling` da conta pessoal: cada modelo com `name`, `competence`, `costPerThousandTokens` e `completionRate`; o `model` de hoje continua valendo como a lista de um modelo só
- [ ] A taxa de conclusão e os tokens por dificuldade do histórico do time continuam por modelo (já são)
- [ ] `taskin plan` mostra a conta e o modelo de cada atribuição no texto e no JSON
- [ ] README da CLI (a entrada `taskin plan` e o exemplo de `resources.scheduling`)

## Notes
Depende da task-233 (os ajustes da conta pessoal na camada da pessoa) e da task-232 (o histórico por modelo).
Os pesos continuam provisórios até a task-229.

### Contexto da rodada
- Ler: `packages/situation/src/system/plugins/scheduler/scheduler.types.ts`, `scheduler.contract.ts`, `packages/situation/src/memory/scheduler.memory.ts`, `packages/situation/src/plan/build-problem.ts`, `scheduling-settings.ts`, `plan-report.ts`, `packages/situation/src/local/plan.local.ts`, `packages/situation/src/plan/plan.test.ts`, `packages/cli/src/commands/plan.ts` e `plan.e2e.test.ts`.
- Não ler: o access broker, o inventário, o `design-vue`.
- Contrato antes do código: primeiro a prova (casos na suíte do plugin e, se o tipo muda, nos tipos), num commit vermelho; só depois a implementação, sem editar caso.

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
