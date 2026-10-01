# 🧩 Task 165 — Os pacotes publicados carregam no Node ESM

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
O @opentask/taskin-utils@1.1.1 publica 'export * from ./security' sem extensao .js, e o Node ESM recusa o import (ERR_MODULE_NOT_FOUND). O @opentask/taskin-git-utils@3.1.0 tem o mesmo defeito ('dist/src/commit-message'), e o @opentask/taskin-file-system-provider@3.4.0, que fixa as duas versoes, cai ao carregar. Qualquer consumidor ESM do provider fs quebra, como o hook do opentask chamado pelo taskin finish. O CLI taskin escapa porque o tsup empacota as dependencias. O utils ja gera saida valida desde o fix-esm-extensions, mas nunca foi republicado; o git-utils nao passa pelo script. Corrigir o build, publicar um patch dos pacotes afetados e fixar um teste que carrega os pacotes como serao publicados (pnpm pack) antes de cada publish.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] O build do `@opentask/taskin-git-utils` passa pelo `fix-esm-extensions`,
      como o utils, o provider fs e o task-manager
- [ ] Verificacao que empacota cada pacote publicavel com `pnpm pack`, instala os
      tarballs num consumidor isolado e carrega cada um no Node ESM (`import` pelo
      nome; `--version` nos CLIs), com teste
- [ ] A verificacao roda no `pnpm test` e antes do `changeset publish`
- [ ] Changeset de patch para utils, git-utils e provider fs
- [ ] Release pelo fluxo do repositorio (hotfix a partir do `main`) e os pacotes
      do registry carregando num consumidor limpo
- [ ] O `main` integrado de volta no `develop`

## Notes

Achado no opentask em 2026-10-01: o hook `node packages/types/dist/integracao/taskin/cli.js <id> --check`,
chamado por `taskin finish`, nao carrega desde que o opentask passou a consumir o
taskin do registry npm (task-023 do opentask).

Estado do registry em 2026-10-01, num consumidor limpo com `node --input-type=module -e "await import(...)"`:

| Pacote | Carrega? |
|---|---|
| `@opentask/taskin-utils@1.1.1` | nao: `dist/security` |
| `@opentask/taskin-git-utils@3.1.0` | nao: `dist/src/commit-message` |
| `@opentask/taskin-file-system-provider@3.4.0` | nao: cai no git-utils, depois no utils |
| `@opentask/taskin-types@2.6.0`, `-task-manager@4.0.0`, `-task-server-ws@0.4.0`, `-task-server-mcp@0.6.0`, `-task-provider-pinia@4.0.0`, `-design-vue@0.6.0`, `ui-sense@0.6.0`, `-dashboard@0.2.0` | sim |
| `taskin@5.0.0` | sim: o tsup empacota as dependencias |

O `fix-esm-extensions.mjs` entrou no build do utils em 2026-08-21, depois do
1.1.1 (2026-03-27), e nenhum changeset tocou o utils desde entao. Os pacotes
publicados fixam as dependencias internas por versao exata (`workspace:*`), entao
republicar so o utils nao conserta o provider fs: ele precisa de um patch que
aponte para o utils e o git-utils novos.

O release sai de um hotfix a partir do `main`, que e o estado publicado da 5.0.0.
O `develop` tem 24 changesets pendentes que nao fazem parte desta correcao.

O outro defeito da mesma investigacao, o `list` do CLI 3.0.3 lendo o cadastro de
usuarios da raiz, ja esta corrigido desde o `taskin@4.0.0` (commit `2240253a`) e
tem teste de regressao em `provider-factory.test.ts`. O `taskin@5.0.0` publicado
resolve o assignee a partir de `.taskin/.taskin-users.json`. No opentask, basta
atualizar o `taskin`.
