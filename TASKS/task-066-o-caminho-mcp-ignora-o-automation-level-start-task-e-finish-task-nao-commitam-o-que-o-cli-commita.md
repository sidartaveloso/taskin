# 🧩 Task 066 — O caminho MCP ignora o automation.level: start_task e finish_task nao commitam o que o CLI commita

- Status: pending
- Type: fix
- Priority: 260
- Assignee: Sidarta Veloso

## Description
O taskin start do CLI, em autopilot, commita a mudanca de status sozinho. O start_task do MCP chama o taskManager direto e nao encosta no git. Duas portas para a mesma operacao, com efeitos diferentes.

## Tasks
- [ ] Teste que afirma o efeito no git, e nao a chamada: depois de `start_task`, o commit de status existe quando o projeto pede
- [ ] `start_task` passa a honrar o `automation.level`
- [ ] `finish_task` idem
- [ ] Conferir se `list_tasks` tem alguma divergencia equivalente
- [ ] Documentar que as duas portas fazem a mesma coisa

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
