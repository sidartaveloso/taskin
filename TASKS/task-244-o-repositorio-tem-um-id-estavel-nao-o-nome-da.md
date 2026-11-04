# 🧩 Task 244 — O repositorio tem um id estavel, nao o nome da pasta

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9691
- Difficulty: 3

## Description
O nome do repositório é o nome da pasta (`path.basename(root)`): clones em pastas diferentes não enxergam o histórico um do outro, o nome da pasta vai ao arquivo versionado, e uma conta pessoal liberada para `app-loja` vale para qualquer pasta com esse nome. O id passa a ser `resources.repository` do `.taskin.json`, se declarado; sem ele, o remote `origin` normalizado (`host/dono/nome`, igual para ssh e https, sem credenciais); sem os dois, o nome da pasta, com aviso em stderr. Worktrees e clones do mesmo repositório têm o mesmo id. Liberações já gravadas com o nome da pasta deixam de valer, e o aviso diz como refazer.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] A prova primeiro, em commit vermelho: ssh e https dão o mesmo id; usuário e token da URL nunca aparecem no id nem no `runs.jsonl` versionado; `resources.repository` tem prioridade; clones em pastas diferentes têm o mesmo id; sem os dois, cai na pasta e avisa
  - Prova: commit `test(task-244)` vermelho; `repository-id.test.ts`; `repository-id.e2e.test.ts` (git de verdade, com worktree e cópia em outra pasta).
- [x] Um remote que não serve de id (caminho local, host sem domínio público, endereço IP) não é usado: ele levaria um dado da máquina ao arquivo versionado
  - Prova: `normalizeRemoteUrl`; o caso "nao serve de id" de `repository-id.test.ts`.
- [x] Liberação gravada com o nome da pasta deixa de valer, e o aviso diz como refazer
  - Prova: "a conta liberada pelo nome da pasta deixa de valer, e o aviso diz como refazer; liberada pelo id, vale".
- [x] `resources.repository` diferente do `origin` gera aviso: quem declara o id herda as liberações daquele id
  - Prova: "resources.repository tem prioridade, e diferente do origin avisa".
- [x] O `taskin plan`, o `taskin run`, o `taskin access`, o `taskin status` e o `taskin list --where` usam o mesmo id
  - Prova: `repositoryIdentityOf` em `probe-situation.ts`, usado por todos; `local-plan.ts` e `status.ts`; "o taskin status usa o mesmo id".
- [x] README da CLI, RDT e changeset
  - Prova: `packages/cli/README.md`, o RDT e o changeset.

## Notes
Sem migração de histórico: nenhum `runs.jsonl` foi commitado.

### O que ficou da rodada
- `resources.repository` é versionado e tem prioridade: um `.taskin.json` hostil pode declarar o id de outro repositório e herdar as liberações dele. O aviso de id diferente do `origin` expõe isso, mas não impede.

### Contexto da rodada
- Ler: `packages/cli/src/lib/probe-situation.ts`, `local-plan.ts`, `packages/cli/src/commands/status.ts`.
- Não ler: o escalonador, o `design-vue`.

### Verificacao
```bash
pnpm exec turbo run build --filter=taskin...
pnpm taskin lint
pnpm --filter @opentask/taskin-situation typecheck
pnpm --filter @opentask/taskin-situation test
pnpm --filter taskin typecheck
pnpm --filter taskin test
pnpm --filter taskin exec vitest run -c vitest.e2e.config.ts
```

### Onde executar
Interativo ou sandcastle, dentro do lote `situacao-lote-9`, antes da mescla na `develop`.

Fechar a task só com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
