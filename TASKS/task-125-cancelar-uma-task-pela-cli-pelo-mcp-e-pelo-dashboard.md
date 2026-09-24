# 🧩 Task 125 — Cancelar uma task pela CLI, pelo MCP e pelo dashboard

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Priority: 900

## Description
O status canceled existe no schema e conta como fechado no filtro, mas nenhuma superficie o aplica: nao ha taskin cancel, nem ferramenta no MCP, nem acao no dashboard. Para cancelar uma task obsoleta hoje so editando o arquivo a mao, que e o que o projeto pede para nao se fazer. Operacao nomeada no ITaskManager, entrando no portao de SUPERFICIES_DAS_OPERACOES, com o motivo do cancelamento registrado na task.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] `cancelTask(taskId, reason)` no `ITaskManager`, entrando em `SUPERFICIES_DAS_OPERACOES`
- [ ] `taskin cancel <task> --reason "<motivo>"` na CLI; o motivo vai para as Notes da task, porque cancelar sem dizer por que e o mesmo defeito do `done` sem evidencia
- [ ] Ferramenta no MCP e acao no dashboard
- [ ] Recusar cancelar task ja fechada; decidir se `canceled` pode voltar a `pending`
- [ ] Commit automatico de status, como os outros comandos do ciclo
- [ ] Documentacao nas quatro frentes: `README.md` da raiz, `packages/cli/README.md`, `docs/` e o site em `packages/docs/content/` nos dois idiomas
- [ ] Verificacao: `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

Achado revisando a fila: a task-034 pede decisoes para um WIP da branch
`feat/task-032` que o trabalho de 2026-09-24 (grupos aninhados, `parent`) ja
tomou, e nao ha como cancela-la sem editar o arquivo a mao.
