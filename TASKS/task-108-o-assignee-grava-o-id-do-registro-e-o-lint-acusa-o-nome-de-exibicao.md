# 🧩 Task 108 — O Assignee grava o id do registro, e o lint acusa o nome de exibicao

- Status: in-progress
- Type: fix
- Assignee: Sidarta Veloso

## Description
O taskin new -u <id> resolve o usuario e grava user.name no Assignee (file-system-task-provider.ts, createTask), e o taskin lint nao acusa porque resolveUser tambem casa pelo nome, entao o nome de exibicao cai em 'resolved'. O Assignee deve guardar o id, que e a chave estavel do registro; o nome muda. Corrigir a escrita no createTask e fazer o lint avisar do nome de exibicao e o lint --fix reescreve-lo para o id.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Fazer passar `packages/file-system-task-provider/src/file-system-task-provider.assignee-by-id.test.ts` (4 testes, hoje vermelhos): `createTask` grava o id recebendo o id ou o nome; `lint` avisa do nome de exibicao sugerindo o id; `lint --fix` reescreve e o lint seguinte sai limpo
- [ ] `createTask` grava `assignee.id` em vez de `assignee.name` (`file-system-task-provider.ts`, `generateTaskMarkdown` no `createTask`)
- [ ] `classifyAssignee` distingue "casou pelo id" de "casou pelo nome": o segundo vira `correctable` com o id como sugestao, e `fixAssignees` o reescreve (`assignee-identity.ts`)
- [ ] Revisar os testes que hoje afirmam o comportamento antigo: `file-system-task-provider.assignees.test.ts` ("says nothing about a resolved assignee" usa `'Ana Souza'`; o teste do usuario sintetico tambem escreve `'Ana Souza'`) e `assignee-identity.test.ts`
- [ ] Conferir as outras superficies: o MCP (`task-server-mcp`) e o dashboard nao gravam `Assignee:` por conta propria; se gravarem, gravar o id tambem
- [ ] Rodar `pnpm taskin lint --fix` neste repositorio e commitar a migracao das tasks
- [ ] Documentacao: onde se descreve o `Assignee:` e o `-u` (README da raiz, `packages/cli/README.md`, `docs/`, `packages/docs/content/` nos dois idiomas) dizer que o valor e o id
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format` e `pnpm test`

## Notes
**Reproducao.** Esta propria task foi criada com `pnpm taskin new ... -u sidartaveloso` e saiu com `Assignee: Sidarta Veloso`; `pnpm taskin lint` nao reclama.

**Causa.** `createTask` faz `resolveUser(options.assignee)` e grava `assignee?.name || i18n.defaultAssignee`. No lint, `classifyAssignee` chama `resolveUser`, que casa por id *ou* por nome, entao o nome de exibicao retorna `resolved` e nao gera aviso.

**Alcance neste repositorio** (contagem das linhas `Assignee:` em `TASKS/` no dia da abertura): 72 tasks com `Sidarta Veloso`, 23 com `sidartaveloso`. O `--fix` tem que converter as 72.

**Por que o id.** O nome de exibicao muda (grafia, acento, casamento) e nao e unico; o id e a chave pela qual o registro, o `stats --team` e o filtro por assignee se encontram. Com o nome gravado, renomear alguem em `.taskin/.taskin-users.json` deixa todas as tasks dele sem resolver.

**Cuidado.** A leitura (`getAllTasks`) deve continuar aceitando o nome, para nao quebrar arquivos antigos antes do `--fix`; o que muda e que o lint passa a acusar.
