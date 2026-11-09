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
- [x] A prova primeiro, em commit vermelho: um `.taskin.json` que declara o id de outro repositório, com o mesmo texto de comando, não herda a liberação nem a aprovação; sem `origin`, o id declarado também não herda; duas pastas de mesmo nome sem `origin` não dividem confiança
  - Prova: commit `fd4ba0ee` vermelho; `repository-id.e2e.test.ts` ("um .taskin.json que declara o id de outro repositorio": "com o mesmo texto de comando, nao herda a liberacao nem a aprovacao", "sem origin, baixado como arquivo, tambem nao herda"; "duas pastas de mesmo nome, sem origin, nao dividem a liberacao").
- [x] `resolveRepositoryIdentity` devolve o id do histórico e o de confiança; o aviso de id diferente do `origin` sai, porque deixa de haver risco
  - Prova: `resolveRepositoryIdentity` devolve `id` e `trustId` em `repository-id.ts`; "o id declarado diferente do origin nao avisa: so rotula o historico" em `repository-id.test.ts`.
- [x] O remote de máquina privada, sem credenciais, serve como id de confiança, que nunca vai a arquivo versionado
  - Prova: `remoteParts` em `repository-id.ts`; "um remote privado nao vai ao historico, mas serve de confianca, sem credenciais" e o e2e "um remote de maquina privada da confianca entre clones, sem ir ao historico".
- [x] O inventário e a aprovação usam o id de confiança; o registro e os relatórios usam o do histórico; o caminho da pasta nunca vai ao `runs.jsonl`
  - Prova: `ProbedSituation.repository` (confiança) e `historyRepository` em `probe-situation.ts`; `plan.local.ts`, `local-plan.ts`, `run.ts` e `status.ts`; em `run.e2e.test.ts`, o histórico não contém `path:` nem o caminho da pasta.
- [x] Liberação gravada com o nome da pasta ou com o id declarado deixa de valer, e o aviso diz o que trocar
  - Prova: "liberacao gravada com o nome da pasta deixa de valer" e "liberacao gravada com o id declarado tambem deixa de valer" em `repository-id.test.ts`.
- [x] RDT, README da CLI, changeset, o mapa e a página da revisão; o RDT registra que aprovar um comando que chama um script do repositório é confiar naquele repositório
  - Prova: `docs/RDT/consciencia-situacional.md` (o "ativar", os dois ids, a tabela dos nomes e o limite da aprovação), `packages/cli/README.md`, `.changeset/consciencia-situacional.md` e `docs/RDT/consciencia-situacional-mapa.html`.

## Notes
Depende das tasks 243 e 244.

### O que ficou da rodada
- Trocar de remote, usar um fork ou um espelho muda o id de confiança: a liberação e a aprovação precisam ser refeitas, e o aviso diz o que trocar. Sem `origin`, um worktree também tem confiança própria, porque o caminho é outro.
- A aprovação cobre o texto do comando, não o script que ele chama; o RDT registra isso.

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
