# 🧩 Task 066 — O caminho MCP ignora o automation.level: start_task e finish_task nao commitam o que o CLI commita

- Status: in-progress
- Type: fix
- Priority: 260
- Assignee: Sidarta Veloso

## Description
O taskin start do CLI, em autopilot, commita a mudanca de status sozinho. O start_task do MCP chama o taskManager direto e nao encosta no git. Duas portas para a mesma operacao, com efeitos diferentes.

## Tasks
- [x] Teste que afirma o efeito no git, e nao a chamada: depois de `start_task`, o commit de status existe quando o projeto pede
- [x] `start_task` passa a honrar o `automation.level`
- [x] `finish_task` idem
- [x] Conferir se `list_tasks` tem alguma divergencia equivalente
- [x] Documentar que as duas portas fazem a mesma coisa

## Resolucao

A decisao de desenho seguiu o "Cuidado ao implementar": o pacote
`@opentask/taskin-task-server-mcp` fala so com o `ITaskManager` e **nao** ganhou
dependencia de git. A automacao entra por um gancho injetado: `MCPServerConfig`
recebe um `onStatusChange` opcional, que o servidor chama depois de `start_task`
e `finish_task` mudarem o status (best-effort — um gancho que falha e logado, nao
derruba a chamada, porque o status ja mudou). Quem monta o gancho e a CLI, em
`lib/mcp-status-hook`, onde a config e o git ja vivem: le `automation.level` via
`ConfigManager` e commita a mudanca com o mesmo `commitTaskStatusChangeOnBranch`
que o `taskin start`/`finish` usam. Em `manual` nenhum gancho e ligado, entao a
porta MCP tambem nao commita — igual a CLI naquele projeto.

- **Efeito no git, nao a chamada**: `mcp-status-hook.integration.test.ts` roda
  num repo git real e afirma que o commit `docs(TASKS): … atualiza status …`
  existe sob `autopilot` e nao existe sob `manual`.
- **`list_tasks`**: sem divergencia — e read-only e o `taskin list` tambem nao
  commita. O teste do pacote MCP afirma que o gancho nao dispara em `list_tasks`.
- **Documentado** no README do pacote MCP (secao "Parity with the CLI").

Arquivos: `packages/task-server-mcp/src/task-server-mcp.types.ts` (tipos
`TaskStatusChange`/`TaskStatusChangeHook` + campo `onStatusChange`),
`packages/task-server-mcp/src/task-server-mcp.ts` (invoca o gancho),
`packages/cli/src/lib/mcp-status-hook/index.ts` (monta o gancho a partir da
config) e `packages/cli/src/commands/mcp-server.ts` (liga o gancho ao servidor).

## Notes
**Como apareceu.** Foi descoberto por acidente, e a forma da descoberta e a
melhor descricao do defeito. Eu precisava saber se um agente autonomo tinha
usado o servidor MCP ou o CLI, e o log nao mostrava as chamadas de ferramenta.
Achei a resposta comparando duas execucoes:

| | rodada pelo CLI | rodada pelo MCP |
| --- | --- | --- |
| status da tarefa | `in-progress` | `in-progress` |
| commit `docs(TASKS): … in-progress [skip ci]` | **existe** | **nao existe** |

O `taskin start` do CLI, com `automation.level: autopilot`, commita a mudanca de
status sozinho. O `start_task` do MCP chama o `taskManager` direto e nao encosta
no git. Foi otimo como prova — e e exatamente o problema.

**Por que importa.** Sao duas portas para a mesma operacao, com efeitos
diferentes, e a diferenca nao esta documentada em lugar nenhum. Quem trabalha
pelo agente perde o commit de status que quem trabalha pelo terminal ganha; o
historico do projeto fica dependendo de qual porta a pessoa usou. Pior: o
`automation.level` e uma configuracao **do projeto**, e uma das portas
simplesmente nao a consulta.

E a mesma forma de defeito que aparece o tempo todo neste repositorio — uma
capacidade que existe numa superficie e falta na outra, divergindo em silencio.

**O teste que vale.** Afirmar o **efeito no git**, e nao que uma funcao foi
chamada. Depois de `start_task` num projeto configurado como autopilot, o commit
de status tem que existir; num projeto configurado como manual, nao. Um teste
que so verifica a chamada passaria com a implementacao errada.

**Cuidado ao implementar.** O servidor MCP fala com o `ITaskManager`, que e
agnostico de provider e nao deve ganhar dependencia de git. A automacao vive na
CLI (`lib/config-manager`, `GitService`) e no provider de arquivos. Onde exatamente
a responsabilidade deve morar e a decisao de desenho desta task — e vale decidir
antes de escrever o teste, nao depois.
