# 🧩 Task 074 — finishTask avisa sobre critérios de conclusão em aberto (getCompletionBlockers)

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 6451

## Description
Deriva da decisão em `docs/RDT/portao-de-conclusao-e-evidencia.md` (task-069),
perguntas 1 e 3. Depende de T-073 (leitor único). O conceito é de domínio, a
representação é de provider: o `finishTask` consulta uma capacidade opcional do
provider e avisa, não recusa (bloqueio fica atrás de config opt-in).

## Tasks
- [x] Adicionar `getCompletionBlockers?(task)` opcional ao `ITaskProvider` (`packages/task-manager/src/task-manager.types.ts`)
- [x] Implementar no `file-system-task-provider` sobre o leitor de T-073
- [x] `TaskManager.finishTask` consulta a capacidade quando presente; provider sem ela conclui sem portão (degradação graciosa)
- [x] Aviso por padrão (não recusa); bloqueio atrás de config opt-in (`completionGate: 'block'`)
- [x] CLI (`taskin finish`) e servidor MCP (`finish_task`) exibem os blockers no retorno
- [x] Testes: aviso com item em aberto, silêncio com tudo feito/adiado, provider sem a capacidade

### O que comprova cada item

`completion-blockers.test.ts` — 4 testes, no `task-manager`.

| o que se afirma | teste |
| --- | --- |
| provider sem a capacidade conclui | `conclui em silencio quando o provider nao tem a capacidade` |
| relata o que o provider aponta | `relata os itens em aberto que o provider aponta` |
| **avisa, e nao recusa** | `conclui mesmo assim: avisa, e nao recusa` |
| silencio com tudo resolvido | `nao relata nada quando tudo esta feito ou adiado` |

Exercitado de ponta a ponta:

```
$ taskin finish 001
⚠ 1 completion criteria still open:
  • O que foi esquecido (line 12)
ℹ Tick them, or say why they were dropped: "— adiado: <reason>".
✓ Task 001 completed successfully! 🎉
```

O item adiado com razao nao aparece; o esquecido aparece com a linha; e a tarefa
**fecha do mesmo jeito**.

**A capacidade e opcional no `ITaskProvider`**, e isso e desenho, nao omissao:
checklist e uma forma do provider de arquivos. O Jira tem subtarefas, o GitHub
tem itens de lista na descricao, e uma fonte sem nada equivalente simplesmente
nao implementa — em vez de receber uma chamada que falha.

**O relato viaja tambem na resposta do MCP** (`openCriteria`), e nao so no texto:
um agente precisa poder **reagir** ao que ficou em aberto. Foi justamente um
agente que fechou quatro tarefas com o checklist inteiro vazio.

## Notes
Não mexer no prompt do agente — ele já exige evidência e resolveu o caso
autônomo. Esta task cobre quem digita `taskin finish`. Ver tabela de "dureza" na
decisão.
