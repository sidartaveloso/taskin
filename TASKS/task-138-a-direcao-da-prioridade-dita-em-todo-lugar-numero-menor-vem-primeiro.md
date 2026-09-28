# 🧩 Task 138 — A direcao da prioridade dita em todo lugar: numero menor vem primeiro

- Status: done
- Type: docs
- Assignee: sidartaveloso

## Description
O Priority e uma posicao na fila, e numero menor vem primeiro, mas o nome sugere o contrario (foi o erro do prompt do sandcastle, que dizia Higher wins). Os READMEs e os guias do MCP dizem lower comes first; faltam o site nos dois idiomas, a descricao do argumento [priority] do taskin priority, e o --sort manual (priority) da CLI e do list_tasks do MCP. E o docs/TASK_LINTER_USAGE.md sugere Priority: low/medium/high/critical para um campo numerico, com um exemplo de formato desatualizado (campos sem o marcador de lista e o titulo depois deles).

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Levantamento: `README.md`, `packages/cli/README.md`, `docs/QUICKSTART.md`, `docs/MCP_CLAUDE_SETUP.md`, `docs/MCP_VSCODE_SETUP.md`, `packages/task-server-mcp/README.md` e o campo `priority` do `set_priority` ja diziam `lower comes first` / `menor vem antes`; o `taskin new --help` tambem (o texto so quebra em duas linhas)
- [x] Site: paragrafo novo antes do `set_priority` em `packages/docs/content/index.md` e `pt-br/index.md` — posicao na fila, numero menor primeiro, sem numero atras de todas, e o que o `--top` faz. `pnpm --filter @taskin/docs build` verde
- [x] `taskin priority --help`: `a number (lower comes first)` (`packages/cli/src/commands/priority.ts`)
- [x] `--sort` do `taskin list` e do `list_tasks` do MCP: `manual (by priority, lower first)` (`packages/cli/src/commands/list.ts`, `packages/task-server-mcp/src/task-server-mcp.ts`). Conferido na ajuda compilada
- [x] `docs/TASK_LINTER_USAGE.md`: a secao de formato mostra o que o `taskin new` gera e o lint confere — titulo `# 🧩 Task NNN — Titulo`, os campos como item de lista, e so os seis campos que o provider le (`Status`, `Type`, `Assignee`, `Priority`, `Group`, `Difficulty`), com os sete status do `TASK_STATUSES`. Sai o `Priority: low/medium/high/critical` e os `Due`/`Tags`, que nao existem. A regra de titulo e a do linter (`h1Pattern` em `packages/cli/src/lib/file-system-task-linter/file-system-task-linter.ts`), e nao a antiga "titulo igual ao nome do arquivo"
- [x] Changeset `.changeset/direcao-da-prioridade.md`
- [x] Verificacao: `pnpm typecheck`, `pnpm lint`, `pnpm test` (44/44) e `biome check .` verdes

