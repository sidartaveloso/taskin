# 🧩 Task 074 — finishTask avisa sobre critérios de conclusão em aberto (getCompletionBlockers)

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso
- Priority: 260

## Description
Deriva da decisão em `decisoes/portao-de-conclusao-e-evidencia.md` (task-069),
perguntas 1 e 3. Depende de T-073 (leitor único). O conceito é de domínio, a
representação é de provider: o `finishTask` consulta uma capacidade opcional do
provider e avisa, não recusa (bloqueio fica atrás de config opt-in).

## Tasks
- [ ] Adicionar `getCompletionBlockers?(task)` opcional ao `ITaskProvider` (`packages/task-manager/src/task-manager.types.ts`)
- [ ] Implementar no `file-system-task-provider` sobre o leitor de T-073
- [ ] `TaskManager.finishTask` consulta a capacidade quando presente; provider sem ela conclui sem portão (degradação graciosa)
- [ ] Aviso por padrão (não recusa); bloqueio atrás de config opt-in (`completionGate: 'block'`)
- [ ] CLI (`taskin finish`) e servidor MCP (`finish_task`) exibem os blockers no retorno
- [ ] Testes: aviso com item em aberto, silêncio com tudo feito/adiado, provider sem a capacidade

## Notes
Não mexer no prompt do agente — ele já exige evidência e resolveu o caso
autônomo. Esta task cobre quem digita `taskin finish`. Ver tabela de "dureza" na
decisão.
