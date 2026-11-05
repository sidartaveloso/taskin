# 🧩 Task 246 — A confianca nao vem do arquivo versionado: o id declarado so nomeia o historico

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso
- Group: situacao-lote-9
- Priority: 9693
- Difficulty: 3

## Description
O `resources.repository` é versionado e vinha decidindo tudo: um `.taskin.json` hostil podia declarar o id de outro repositório, herdar as liberações da pessoa e, com o mesmo texto de comando, passar pela aprovação com o token no ambiente, rodando um script do repositório hostil. O id se separa em dois. O id do histórico (o campo `repository` do `runs.jsonl`) continua aceitando `resources.repository`, porque falsificá-lo só rotula as linhas do próprio arquivo. O id de confiança, que decide `releasedTo` e a aprovação do comando, vem do `origin`, que o clone não traz do arquivo, ou do caminho da pasta, e nunca do arquivo versionado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] A prova primeiro, em commit vermelho: um `.taskin.json` que declara o id de outro repositório, com o mesmo texto de comando, não herda a liberação nem a aprovação; sem `origin`, o id declarado também não herda; duas pastas de mesmo nome sem `origin` não dividem confiança
- [ ] `resolveRepositoryIdentity` devolve o id do histórico e o de confiança; o aviso de id diferente do `origin` sai, porque deixa de haver risco
- [ ] O remote de máquina privada, sem credenciais, serve como id de confiança, que nunca vai a arquivo versionado
- [ ] O inventário e a aprovação usam o id de confiança; o registro e os relatórios usam o do histórico; o caminho da pasta nunca vai ao `runs.jsonl`
- [ ] Liberação gravada com o nome da pasta ou com o id declarado deixa de valer, e o aviso diz o que trocar
- [ ] RDT, README da CLI, changeset, o mapa e a página da revisão; o RDT registra que aprovar um comando que chama um script do repositório é confiar naquele repositório

## Notes
Depende das tasks 243 e 244.

### Contexto da rodada
- Ler: `packages/situation/src/local/repository-id.ts`, `packages/cli/src/lib/repository-identity.ts` e `probe-situation.ts`, `packages/situation/src/local/plan.local.ts`, `packages/cli/src/commands/run.ts`, `access.ts` e `status.ts`.
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
