# 🧩 Task 190 — O executor de voz: cada operação da superfície alexa chama o ITaskManager do repositório escolhido

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: alexa-etapa-1
- Priority: 7600
- Difficulty: 3

## Description
Pacote local que recebe as operações da superfície alexa, acha o repositório pelo nome falado e chama o ITaskManager dele, aceitando só a lista fechada e commitando só o status.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Pacote novo `packages/task-server-alexa` (`@opentask/taskin-task-server-alexa`), no molde de `task-server-mcp` e, como ele, sem saber de git
- [ ] Tipos das mensagens: `PedidoDeVoz` (`operacao: NomeNaSuperficie<'alexa'>`, `projeto?`, `numero?`, `titulo?`, `tipo?`) e `RespostaDeVoz` estruturada, não falada (a fala é da skill), com os erros nomeados: projeto não encontrado, projeto ambíguo, task não encontrada, operação recusada
- [ ] Portas `RegistroDeRepositorios` (os repositórios ativados, com nome falado e caminho; implementada pela task-191) e `AcharProjeto` (implementada pela task-192). Nos testes, versões em memória
- [ ] Teste primeiro por operação: `ExecutorDeVoz.executar(pedido)` acha o repositório, obtém o `ITaskManager` dele e chama a operação, com o provider em memória de `@opentask/taskin-task-manager/testing`
- [ ] Lista fechada: operação fora de `nomesNaSuperficie('alexa')` é recusada antes de tocar qualquer repositório (teste com um nome inventado e com `reviewTask`)
- [ ] Teste no molde do `superficies.test.ts` do MCP: o executor atende cada nome de `nomesNaSuperficie('alexa')`
- [ ] Só commit de status: começar, pausar e concluir chamam o `onStatusChange` injetado, e nada mais. Na CLI, o gancho é o de `createMcpStatusCommitHook`; dar a ele um nome sem "Mcp" e manter o antigo como alias, se tiver uso fora da CLI
- [ ] Concluir devolve os critérios em aberto de `finishTaskComRelato`
- [ ] Criar chama `createTask` com título e tipo; sem tipo na fala, o mesmo padrão do `taskin new` sem `-t`
- [ ] Um teste que varre o código-fonte do pacote e falha se aparecer `child_process` ou `@opentask/taskin-git-utils`: a voz não roda comando

## Notes
Depende da task-187.

### Contexto da rodada
- Ler: `packages/task-server-mcp/package.json`, `tsconfig.json` e `src/index.ts`; em `src/task-server-mcp.ts`, só o tratamento de `start_task` e `finish_task` e o uso de `onStatusChange`; `src/task-server-mcp.types.ts` (`TaskStatusChangeHook`); `packages/task-manager/src/task-manager.types.ts`, da interface `ITaskManager` até o fim; `packages/task-manager/src/testing.ts`; `packages/cli/src/lib/mcp-status-hook/index.ts`.
- Não ler: prompts e resources do MCP, os comandos da CLI, o dashboard.

### Verificacao
```bash
pnpm --filter @opentask/taskin-task-server-alexa typecheck
pnpm --filter @opentask/taskin-task-server-alexa test
pnpm --filter taskin test -- mcp-status-hook
pnpm lint:manifests
```

### Onde executar
Sandcastle, em qualquer máquina.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
