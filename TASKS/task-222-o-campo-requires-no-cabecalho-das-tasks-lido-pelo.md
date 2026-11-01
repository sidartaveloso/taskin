# 🧩 Task 222 — O campo Requires no cabeçalho das tasks, lido pelo provider e conferido pelo lint

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: situacao-lote-5
- Difficulty: 3
- Priority: 9500

## Description
Os requisitos de cada task num campo do cabeçalho, `- Requires:`, com valores de uma lista fechada no `types-ts`. O provider de arquivos lê e grava o campo, o `taskin lint` acusa valor desconhecido, e o `taskin status` passa a usar o campo do provider em vez de ler o arquivo por conta própria.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Em `packages/types-ts/src/taskin.schemas.ts`: a lista fechada `CAPABILITIES` (`docker`, `android-sdk`, `jdk21`, `gpu`, `interactive`, `microphone`, `visual-review`), o padrão `review:<competência>` para os pedidos de ponto de vista (`review:design`, `review:electronics`), e `requires` opcional no `TaskSchema`, validado pela lista e pelo padrão
- [ ] O provider de arquivos lê `- Requires: a, b` do cabeçalho (com o nome do campo pelo `i18n.ts`: `Requires` em inglês, `Requer` em português) e grava o campo sem tocar no resto do arquivo
- [ ] O `taskin lint` acusa como erro um valor fora da lista, citando a task e os valores aceitos, e como aviso um valor repetido
- [ ] `packages/cli/src/commands/status.ts` usa o `requires` da task e perde o `requiresOf`, que lia o arquivo com uma expressão regular
- [ ] Testes no `types-ts`, no provider (leitura, escrita, as duas línguas) e no linter, e o e2e do `taskin status` verde sem mudança

## Notes
Primeira task da segunda rodada da consciência situacional (`docs/RDT/consciencia-situacional.md`, etapa 2).

### Contexto da rodada
- Ler: em `packages/types-ts/src/taskin.schemas.ts`, só o `TaskSchema` e o `TaskPrioritizationUpdateSchema` (perto da linha 200); em `packages/file-system-task-provider/src/file-system-task-provider.ts`, só as funções que leem e gravam os campos do cabeçalho (`Difficulty` é o molde: perto das linhas 73-95, 200-215 e 380); `packages/file-system-task-provider/src/i18n.ts`; `packages/cli/src/lib/file-system-task-linter/file-system-task-linter.ts`; em `packages/cli/src/commands/status.ts`, só `requiresOf` e quem o chama.
- Não ler: o pacote `situation` por dentro, o `design-vue`, os servidores MCP e WebSocket.

### Verificacao
```bash
pnpm --filter @opentask/taskin-types typecheck
pnpm --filter @opentask/taskin-types test
pnpm --filter @opentask/taskin-file-system-provider typecheck
pnpm --filter @opentask/taskin-file-system-provider test
pnpm --filter taskin typecheck
pnpm --filter taskin lint
pnpm --filter taskin test
```

### Onde executar
Sandcastle, lote `situacao-lote-5` (dificuldade 3): `SANDCASTLE_GROUP=situacao-lote-5 SANDCASTLE_MODEL=claude-sonnet-5-5 pnpm exec tsx .sandcastle/main.ts`, numa máquina Linux com Docker nativo. Sempre a partir de um clone na `develop` atualizada (`git fetch origin && git switch develop && git pull --ff-only`), nunca de uma branch de task: o sandcastle mescla o resultado no HEAD de onde é chamado.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
