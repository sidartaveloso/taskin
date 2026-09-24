# 🧩 Task 115 — Pontuar a dificuldade pela CLI e pelo MCP

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Group: g-n1xf2yf7
- Priority: 3800

## Description
A task-102 deu a CLI e ao MCP o filtro --unscored, a fila do que falta pontuar, mas nenhuma das duas consegue pontuar: setDifficulty existe no ITaskManager desde a task-106 e so o dashboard o expoe, declarado assim na tabela do portao. Expor nas tres superficies: taskin difficulty <task> <1-5>, --difficulty no taskin new e set_difficulty no MCP.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] `taskin difficulty <task> <1-5>`, chamando `setDifficulty`; recusa com clareza valor fora de 1 a 5 e task inexistente — `packages/cli/src/commands/difficulty.ts`; e2e `taskin difficulty` em `packages/cli/src/commands/group-priority.e2e.test.ts` ("grava a dificuldade, e a task sai do --unscored e entra no --scored", "recusa %j dizendo a faixa, sem gravar" para `0`, `6`, `2.5`, `dificil`, `""`, e "recusa uma tarefa que nao existe")
- [x] Decidir e declarar como se **tira** a dificuldade — decidido: **nao se tira**, em nenhuma superficie. `setDifficulty` so grava de 1 a 5 e o quadro tambem so troca um valor por outro; pontuacao errada se corrige pontuando de novo. Tirar exigiria uma operacao nova no `ITaskManager` (e passar pelo portao), que ninguem pediu. Declarado no JSDoc de `difficultyCommand`, na descricao da ferramenta `set_difficulty`, em `packages/cli/README.md`, `packages/task-server-mcp/README.md`, `docs/MCP_CLAUDE_SETUP.md` e no RDT
- [x] `--difficulty <1-5>` no `taskin new`, validado antes de criar o arquivo, como o `--priority` da task-105 — `packages/cli/src/commands/new.ts` (`lerDificuldade` no mesmo `try` do `lerPrioridade`); e2e `taskin new --difficulty`: "a tarefa ja nasce pontuada" e "dificuldade invalida recusa antes de criar o arquivo"
- [x] `set_difficulty` no servidor MCP — `handleSetDifficulty` em `packages/task-server-mcp/src/task-server-mcp.ts`; o schema anuncia `integer` com `minimum`/`maximum` e a resposta passa a trazer `task.difficulty`
- [x] Trocar, em `SUPERFICIES_DAS_OPERACOES`, a justificativa de "so dashboard" pelas entradas `cli` e `mcp` — `setDifficulty: { cli: 'difficulty', mcp: 'set_difficulty', ws: 'set-difficulty' }`. `register.superficies.test.ts` ("`taskin difficulty` existe") e `superficies.test.ts` ("a ferramenta set_difficulty e anunciada") passam a exigi-las, por derivarem de `nomesNaSuperficie`; mais o teste "pontuar chega as tres superficies (task-115)" em `superficies-das-operacoes.test.ts`
- [x] TDD nas tres camadas — task-manager: `validar-dificuldade/validar-dificuldade.test.ts` (a faixa e perguntada ao `TaskSchema`, e `setDifficulty` passou a usar `validarDificuldade`; o contrato existente continua verde); CLI: e2e acima; MCP: `describe('pontuar por MCP')` em `packages/task-server-mcp/src/agrupar-priorizar.test.ts`, contra um `TaskManager` de verdade (grava, sai do `unscored`, recusa `0`/`6`/`2.5`/`"3"`/ausente sem gravar, recusa task inexistente, anunciada sem grupos)
- [x] Documentacao nas quatro frentes — `README.md` (bloco "Group and prioritise"); `packages/cli/README.md` (`taskin difficulty`, `--difficulty` do `new`, `set_difficulty`); `docs/` (`QUICKSTART.md`, `MCP_CLAUDE_SETUP.md`, `MCP_VSCODE_SETUP.md`, `RDT/superficies-derivam-do-mesmo-contrato.md`); site em `packages/docs/content/index.md` e `pt-br/index.md`. `documented-tools.test.ts` do MCP falhava ate a documentacao citar `set_difficulty`
- [x] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test` — format e lint verdes; typecheck verde depois de rebuildar `packages/ui-sense` (dist sem `.d.ts`, o mesmo do ambiente da task-114); testes verdes em task-manager 128, task-server-mcp 104, task-server-ws 30, fs-provider 405, pinia 12; CLI em serie 429/430 — o que falha (`taskin pause > should fail if task is not in progress`) passa isolado, com e sem esta mudanca

## Notes

### Por que

A 102 deu `--unscored` a CLI e ao MCP: a fila do que falta pontuar. Sem um
comando para pontuar, quem trabalha essa fila pela CLI ou por um agente MCP
chega nela e nao consegue fazer nada. O `setDifficulty` ja existe no
`ITaskManager` (task-106), entao o trabalho e expor, e nao implementar regra.

### Como verificar o circuito

`pnpm taskin list --unscored --open` mostra uma task; `pnpm taskin difficulty <id> 3`
a pontua; o mesmo `list` deixa de mostra-la e `list --scored` passa a mostrar.
