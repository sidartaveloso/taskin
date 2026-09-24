# 🧩 Task 108 — O Assignee grava o id do registro, e o lint acusa o nome de exibicao

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
O taskin new -u <id> resolve o usuario e grava user.name no Assignee (file-system-task-provider.ts, createTask), e o taskin lint nao acusa porque resolveUser tambem casa pelo nome, entao o nome de exibicao cai em 'resolved'. O Assignee deve guardar o id, que e a chave estavel do registro; o nome muda. Corrigir a escrita no createTask e fazer o lint avisar do nome de exibicao e o lint --fix reescreve-lo para o id.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Fazer passar `packages/file-system-task-provider/src/file-system-task-provider.assignee-by-id.test.ts` — 5 testes, vermelhos antes da mudanca e verdes depois: `createTask` grava o id recebendo o id ou o nome; grava como foi digitado quem nao esta no registro; `lint` avisa do nome de exibicao sugerindo o id; `lint --fix` reescreve e o lint seguinte sai limpo
- [x] `createTask` grava o id (`file-system-task-provider.ts`, no `createTask`): `resolveUser(...)?.id ?? options.assignee`. Quem nao esta no registro fica como foi digitado, e nao com o id que `createTemporaryUser` inventaria — esse id esconderia do lint o valor que ele precisa mostrar
- [x] `classifyAssignee` so devolve `resolved` quando o valor e o id; o nome de exibicao vira `correctable` com o usuario, e o `fixAssignees` ja existente o reescreve (`assignee-identity.ts`). O aviso do lint diz "is the display name of <id>" nesse caso. Coberto por `assignee-identity.test.ts` ("reports the display name as correctable, not as resolved", "keeps surrounding space out of the comparison with the id")
- [x] Testes que afirmavam o comportamento antigo revistos em `file-system-task-provider.assignees.test.ts`: "says nothing about an assignee written as the id, or a placeholder" (antes usava `'Ana Souza'`), a fixture do usuario sintetico e "creates a task in the configured style" (esperava `Assignee: Ana Souza`). Os de `file-system-task-provider.test.ts` usam usuarios fora do registro e continuam valendo sem mudanca
- [x] Outras superficies: so o `generateTaskMarkdown` do provider de file system grava a linha `Assignee:` (alem do `fixAssignees`). O MCP e o dashboard criam por `ITaskManager.createTask` → provider, logo herdam a correcao sem codigo proprio; o resto (`list.ts`, `App.vue`, `TaskHeader.vue`, `filter-tasks.ts`) so le `assignee.name` para exibir. `user.ts` e o metrics adapter tratam `correctable` como `resolved` na identidade, entao nada deixa de resolver
- [x] `pnpm taskin lint` neste repositorio passou a acusar 73 tasks ("is the display name of \"sidartaveloso\""); `pnpm taskin lint --fix` reescreveu as 73 — o diff em `TASKS/` e exatamente 73 linhas `- Assignee: Sidarta Veloso` → `- Assignee: sidartaveloso` — e o lint seguinte sai com "All task files are valid!"
- [x] Documentacao: `README.md` (exemplo do `new` e a regra no "Metadata Format"), `packages/cli/README.md` (exemplos e a opcao `-u`), `docs/TASK_LINTER_USAGE.md` (formato do Assignee), `packages/docs/content/index.md` e `pt-br/index.md` (exemplo com o id e uma frase sobre a regra), e uma nota em `docs/RDT/identidade-de-grupo-de-tasks.md`, que citava o defeito como precedente. Changeset em `.changeset/assignee-grava-o-id.md`
- [x] `pnpm format`, `pnpm lint` (biome, 689 arquivos, e lint das tasks), `pnpm typecheck` (28/28) e `pnpm test` (turbo 44/44, `file-system-task-provider` 367 testes, `taskin` 374, e os `dev-scripts` 85) — todos verdes

## Notes
**Reproducao.** Esta propria task foi criada com `pnpm taskin new ... -u sidartaveloso` e saiu com `Assignee: Sidarta Veloso`; `pnpm taskin lint` nao reclama.

**Causa.** `createTask` faz `resolveUser(options.assignee)` e grava `assignee?.name || i18n.defaultAssignee`. No lint, `classifyAssignee` chama `resolveUser`, que casa por id *ou* por nome, entao o nome de exibicao retorna `resolved` e nao gera aviso.

**Alcance neste repositorio** (contagem das linhas `Assignee:` em `TASKS/` no dia da abertura): 72 tasks com `Sidarta Veloso`, 23 com `sidartaveloso`. O `--fix` tem que converter as 72.

**Por que o id.** O nome de exibicao muda (grafia, acento, casamento) e nao e unico; o id e a chave pela qual o registro, o `stats --team` e o filtro por assignee se encontram. Com o nome gravado, renomear alguem em `.taskin/.taskin-users.json` deixa todas as tasks dele sem resolver.

**Cuidado.** A leitura (`getAllTasks`) continua aceitando o nome, para nao quebrar arquivos antigos antes do `--fix`: o `resolveUser` nao mudou, so o que o lint faz com o resultado.

**Fora do escopo.** `taskin new` ponta a ponta nao ganhou teste de CLI proprio: o comando repassa `-u` direto para `createTask`, que e o que os testes do provider cobrem.
