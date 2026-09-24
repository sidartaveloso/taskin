# 🧩 Task 115 — Pontuar a dificuldade pela CLI e pelo MCP

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 1100

## Description
A task-102 deu a CLI e ao MCP o filtro --unscored, a fila do que falta pontuar, mas nenhuma das duas consegue pontuar: setDifficulty existe no ITaskManager desde a task-106 e so o dashboard o expoe, declarado assim na tabela do portao. Expor nas tres superficies: taskin difficulty <task> <1-5>, --difficulty no taskin new e set_difficulty no MCP.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `taskin difficulty <task> <1-5>`, chamando `setDifficulty`; recusa com clareza valor fora de 1 a 5 e task inexistente
- [ ] Decidir e declarar como se **tira** a dificuldade (ex.: `taskin difficulty <task> --clear`), ou por que nao se tira
- [ ] `--difficulty <1-5>` no `taskin new`, validado antes de criar o arquivo, como o `--priority` da task-105
- [ ] `set_difficulty` no servidor MCP
- [ ] Trocar, em `SUPERFICIES_DAS_OPERACOES`, a justificativa de "so dashboard" pelas entradas `cli` e `mcp`; os testes `register.superficies.test.ts` e `superficies.test.ts` precisam passar a exigi-las
- [ ] TDD nas tres camadas (task-manager ja tem o contrato; CLI e2e; MCP contra um `TaskManager` de verdade)
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que

A 102 deu `--unscored` a CLI e ao MCP: a fila do que falta pontuar. Sem um
comando para pontuar, quem trabalha essa fila pela CLI ou por um agente MCP
chega nela e nao consegue fazer nada. O `setDifficulty` ja existe no
`ITaskManager` (task-106), entao o trabalho e expor, e nao implementar regra.

### Como verificar o circuito

`pnpm taskin list --unscored --open` mostra uma task; `pnpm taskin difficulty <id> 3`
a pontua; o mesmo `list` deixa de mostra-la e `list --scored` passa a mostrar.
