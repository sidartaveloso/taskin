# 🧩 Task 235 — Uma conta oferece varios modelos: o plano escolhe conta, modelo e maquina para cada task

- Status: done
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
- [x] A prova primeiro, em commit vermelho: na suíte do `scheduler`, uma conta com dois modelos recebe duas tasks de dificuldades diferentes, cada uma no modelo que a cobre pelo menor custo; a soma dos tokens dos modelos de uma conta não passa da cota dela; a atribuição traz o modelo — commit `5735d5cc` (vermelho, 20 falhas); casos em `packages/situation/src/system/plugins/scheduler/scheduler.contract.ts`, seção "Uma conta, varios modelos": "uma conta com dois modelos: cada task vai ao modelo que a cobre pelo menor custo, e a atribuicao diz qual", "a cota e da conta: a soma dos tokens dos modelos dela nao passa do que resta", "com cota da conta para uma so, os dois modelos nao a dividem alem do que resta", "a competencia e a do modelo…", "a nota de uma atribuicao usa a taxa de conclusao e o custo do modelo dela"; modelo fora da conta → `unknown-reference` no caso "o plano que cita o que o problema nao tem…"
- [x] `SchedulingAccess` ganha a lista de modelos (ou o problema ganha a oferta conta × modelo), e `Assignment` ganha `model`; a cota é da conta, não do modelo — `SchedulingModel`, `SchedulingAccess.models` e `Assignment.model` em `scheduler.types.ts`; `resolve`/`violations`/`suggestPlan` em `packages/situation/src/memory/scheduler.memory.ts` (a cota agrupa por conta); `pnpm --filter @opentask/taskin-situation test` (506 verdes)
- [x] `resources.scheduling.accesses.<conta>.models` no `.taskin.json` e `models` no `scheduling` da conta pessoal: cada modelo com `name`, `competence`, `costPerThousandTokens` e `completionRate`; o `model` de hoje continua valendo como a lista de um modelo só — `modelSettingsSchema` e o `refine` (model ou models, não os dois) em `plan/scheduling-settings.ts`, `modelsOf` em `plan/build-problem.ts`; testes em `plan/plan.test.ts`: "o model de hoje continua valendo como a lista de um modelo so", "declarar model e models na mesma conta e recusado", "a conta da pessoa declara os modelos dela no arquivo dela"
- [x] A taxa de conclusão e os tokens por dificuldade do histórico do time continuam por modelo (já são) — agora por modelo dentro da conta: "o historico do time calibra cada modelo da conta pelo nome dele" e "duas contas do mesmo modelo dividem a taxa de conclusao" em `plan/plan.test.ts`
- [x] `taskin plan` mostra a conta e o modelo de cada atribuição no texto e no JSON — `renderPlan` em `plan/plan-report.ts` (`→ conta (modelo) on maquina`, do `Assignment.model`); JSON com `version: 2` e `model` em cada atribuição; testes "cada task vai ao modelo da conta que a cobre pelo menor custo, e o texto e o JSON dizem conta e modelo" (`plan.test.ts`) e "--json e --format json dao o SuggestedPlan com version" (`packages/cli/src/commands/plan.e2e.test.ts`)
- [x] README da CLI (a entrada `taskin plan` e o exemplo de `resources.scheduling`) — `packages/cli/README.md`, entrada `taskin plan`: exemplo com `models` e o parágrafo sobre modelos dividindo a cota

## Notes
Depende da task-233 (os ajustes da conta pessoal na camada da pessoa) e da task-232 (o histórico por modelo).
Os pesos continuam provisórios até a task-229.

Decisões desta rodada:
- `PlanResourceLabel` perdeu `model` (uma conta agora tem vários): o modelo vem em cada atribuição e a lista no problema. Por isso o JSON do `taskin plan` sobe para `version: 2`.
- O que um modelo não declara (competência, custo, taxa) vem dos campos da própria conta e, sem eles, de `DEFAULT_ACCESS_SETTINGS`.

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
