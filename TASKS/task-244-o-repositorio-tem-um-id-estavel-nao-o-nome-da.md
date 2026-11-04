# 🧩 Task 244 — O repositorio tem um id estavel, nao o nome da pasta

- Status: pending
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9691
- Difficulty: 3

## Description
O nome do repositório é o nome da pasta (`path.basename(root)`): clones em pastas diferentes não enxergam o histórico um do outro, o nome da pasta vai ao arquivo versionado, e uma conta pessoal liberada para `app-loja` vale para qualquer pasta com esse nome. O id passa a ser `resources.repository` do `.taskin.json`, se declarado; sem ele, o remote `origin` normalizado (`host/dono/nome`, igual para ssh e https, sem credenciais); sem os dois, o nome da pasta, com aviso em stderr. Worktrees e clones do mesmo repositório têm o mesmo id. Liberações já gravadas com o nome da pasta deixam de valer, e o aviso diz como refazer.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho: ssh e https dão o mesmo id; usuário e token da URL nunca aparecem no id nem no `runs.jsonl` versionado; `resources.repository` tem prioridade; clones em pastas diferentes têm o mesmo id; sem os dois, cai na pasta e avisa
- [ ] Um remote que não serve de id (caminho local, host sem domínio público, endereço IP) não é usado: ele levaria um dado da máquina ao arquivo versionado
- [ ] Liberação gravada com o nome da pasta deixa de valer, e o aviso diz como refazer
- [ ] `resources.repository` diferente do `origin` gera aviso: quem declara o id herda as liberações daquele id
- [ ] O `taskin plan`, o `taskin run`, o `taskin access`, o `taskin status` e o `taskin list --where` usam o mesmo id
- [ ] README da CLI, RDT e changeset

## Notes
Sem migração de histórico: nenhum `runs.jsonl` foi commitado.

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
