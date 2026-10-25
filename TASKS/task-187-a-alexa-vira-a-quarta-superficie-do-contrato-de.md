# 🧩 Task 187 — A Alexa vira a quarta superfície do contrato de operações

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7300
- Difficulty: 2

## Description
Acrescentar a superfície alexa a SUPERFICIES_DAS_OPERACOES, com o nome do intent de cada operação exposta por voz e o motivo escrito de cada uma que fica de fora.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `superficies-das-operacoes.test.ts`: a superfície `alexa` existe e os nomes dela são exatamente `ListTasksIntent`, `CreateTaskIntent`, `StartTaskIntent`, `PauseTaskIntent` e `FinishTaskIntent`. Vermelho antes da mudança
- [ ] `alexa` em `SuperficiesDaOperacao`, e uma `Exposicao` de `alexa` em cada operação de `SUPERFICIES_DAS_OPERACOES`: `getAllTasks` → `ListTasksIntent`, `createTask` → `CreateTaskIntent`, `startTask` → `StartTaskIntent`, `pauseTask` → `PauseTaskIntent`, `finishTaskComRelato` → `FinishTaskIntent`
- [ ] Todas as outras como `ausente`, com o motivo escrito: `finishTask` e `getCompletionBlockers` (a voz conclui pelo relato de `finishTaskComRelato`), `reviewTask` (os hooks rodam comandos como `git push` e por voz ninguém vê o resultado), `lint` (validar arquivo é da CLI), prioridade, grupos e dificuldade (organizar a fila é gesto de tela, e ninguém pediu pela voz)
- [ ] Comentários atualizados: o de `Exposicao` e o de `SuperficiesDaOperacao` passam de três para quatro superfícies; `SO_NA_CLI` deixa de valer para `createTask` na voz, com o motivo do RDT (anotar de longe é o uso mais natural da voz, e quem grava o arquivo é o taskin local)
- [ ] Nada mais muda de comportamento: CLI, MCP e WebSocket mantêm os mesmos nomes, e `register.superficies.test.ts`, o `superficies.test.ts` do MCP e os testes do WebSocket ficam verdes sem alteração

## Notes
Depende só da decisão em `docs/RDT/taskin-na-alexa.md`.

### Contexto da rodada
- Ler: `packages/task-manager/src/superficies-das-operacoes/superficies-das-operacoes.ts` inteiro e o teste ao lado; em `docs/RDT/taskin-na-alexa.md`, só as seções "A decisão" e "As regras da voz".
- Não ler: o resto do `task-manager`, a CLI e os servidores MCP e WebSocket. O tipo de cada um deriva da tabela e não precisa de mudança. Se o `tsc` acusar algo neles, ler só o arquivo acusado.

### Verificacao
```bash
pnpm --filter @opentask/taskin-task-manager typecheck
pnpm --filter @opentask/taskin-task-manager test
pnpm --filter taskin typecheck
pnpm --filter @opentask/taskin-task-server-mcp test
pnpm --filter @opentask/taskin-task-server-ws typecheck
```

### Onde executar
Sandcastle, em qualquer máquina: é TypeScript de um pacote só.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
