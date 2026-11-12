# 🧩 Task 233 — Os ajustes de cada conta do plan moram na camada da pessoa

- Status: done
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-6
- Priority: 9613
- Difficulty: 3
- Requires: docker

## Description
`resources.scheduling.accesses` só era lido do `.taskin.json` versionado, pelo nome da conta; declarar o modelo, a cota ou o custo de uma conta da camada da pessoa obrigava a escrever o nome dela no repositório. Os ajustes de uma conta pessoal passam a morar junto dela, na chave `scheduling` da entrada em `~/.config/taskin/resources.json`; o `taskin plan` junta as camadas e avisa (stderr) quando o `.taskin.json` cita uma conta pessoal. Os ajustes gerais seguem só no `.taskin.json`.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: o ajuste de uma conta pessoal declarado só no arquivo da pessoa chega ao plano (cota, modelo, taxa de conclusão); o aviso aparece quando o `.taskin.json` cita uma conta pessoal; nenhum comando grava o nome da conta no repositório
  - Prova: commit `test(situation): a prova de que os ajustes de uma conta moram na camada da pessoa (vermelha)`; `plan.test.ts` ("os ajustes de uma conta moram na camada da pessoa"), `local.test.ts` ("o ajuste escrito ao lado da conta sobrevive...") e o e2e "os ajustes de uma conta da camada da pessoa" em `plan.e2e.test.ts`.
- [x] `readPersonalAccessSettings`, `PlanAccessInput.settings` e `accessSettingsOf`: o plano usa os ajustes da camada de cada conta
  - Prova: `scheduling-settings.ts`, `build-problem.ts`, `plan.local.ts` (`localPlanResources` devolve `warnings`).
- [x] `taskin plan` avisa no stderr e ignora a linha do `.taskin.json` que cita uma conta pessoal
  - Prova: `packages/cli/src/commands/plan.ts` e o e2e "o .taskin.json que cita a conta da pessoa e avisado no stderr, sem sujar o stdout".
- [x] RDT (Os nomes, O que pode ser versionado), README da CLI e a task 225
  - Prova: `docs/RDT/consciencia-situacional.md`, `packages/cli/README.md`, task 225.

## Notes
- O aviso cita o nome da conta (é a saída local, para a pessoa achar a linha) e nunca vai a arquivo.
- A pessoa não sobrescreve os ajustes gerais (pesos, horizonte, margem, tokens por dificuldade, máquinas): o plano do time tem de ser reproduzível. Está no RDT.

### Verificacao
```bash
pnpm install --frozen-lockfile
pnpm exec turbo run build --filter=taskin...
pnpm taskin lint
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
```

### Onde executar
Sandcastle ou interativo, dentro do lote `situacao-lote-6`, antes da mescla do lote. Sempre a partir de um clone na `develop` atualizada, nunca de uma branch de task.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
