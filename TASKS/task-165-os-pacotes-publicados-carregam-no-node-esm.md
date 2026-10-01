# 🧩 Task 165 — Os pacotes publicados carregam no Node ESM

- Status: in-progress
- Type: fix
- Assignee: sidartaveloso

## Description
O @opentask/taskin-utils@1.1.1 publica 'export * from ./security' sem extensao .js, e o Node ESM recusa o import (ERR_MODULE_NOT_FOUND). O @opentask/taskin-git-utils@3.1.0 tem o mesmo defeito ('dist/src/commit-message'), e o @opentask/taskin-file-system-provider@3.4.0, que fixa as duas versoes, cai ao carregar. Qualquer consumidor ESM do provider fs quebra, como o hook do opentask chamado pelo taskin finish. O CLI taskin escapa porque o tsup empacota as dependencias. O utils ja gera saida valida desde o fix-esm-extensions, mas nunca foi republicado; o git-utils nao passa pelo script. Corrigir o build, publicar um patch dos pacotes afetados e fixar um teste que carrega os pacotes como serao publicados (pnpm pack) antes de cada publish.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] O build do `@opentask/taskin-git-utils` passa pelo `fix-esm-extensions`,
      como o utils, o provider fs e o task-manager
- [x] O `@opentask/taskin-git-utils` declara `files` — sem ele, o `.gitignore` da
      raiz (`**/src/**/*.js`) tirava `dist/src/*.js` do tarball, e so o `main` entrava
- [x] Verificacao que empacota cada pacote publicavel com `pnpm pack`, instala os
      tarballs num consumidor isolado e carrega cada um no Node ESM (`import` pelo
      nome; `--version` nos CLIs), com teste — `dev/scripts/verificador-de-carga-esm/`
- [x] A verificacao roda no `pnpm test` (`verificador-de-carga-esm.taskin.test.ts`) e
      antes do `changeset publish` (`pnpm verificar:carga-esm` no `changeset:publish`)
- [x] Changeset de patch para utils, git-utils e provider fs
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

O `git-utils@3.1.0` tem um segundo defeito, que a verificacao achou depois de
corrigida a extensao: o tarball publicado tem 25 arquivos e, de `dist`, so o
`dist/src/index.js`. Sem `files` no package.json, o pack aplica o `.gitignore` da
raiz, cuja regra `**/src/**/*.js` (JS gerado dentro de `src/`) casa com o
`dist/src/` do git-utils. O `main` entra porque o npm sempre o inclui.

A verificacao reprova cada defeito isolado, com o build do repo:

- utils construido so com `tsc`: `ERR_MODULE_NOT_FOUND ... taskin-utils/dist/security`
  no utils e no provider fs — o erro do opentask;
- git-utils construido so com `tsc`: `... git-utils/dist/src/commit-message` no
  git-utils e no provider fs;
- git-utils sem `files`: `... git-utils/dist/src/commit-message.js`, ausente do tarball.

Com as correcoes, as 14 cargas passam (12 bibliotecas por `import`, 3 bins por
`--version`, contando os dois bins do `@opentask/taskin`).

Plano do changesets: `taskin-utils` 1.1.2, `taskin-git-utils` 3.1.1,
`taskin-file-system-provider` 3.4.1 e, em cascata pelo `workspace:*`,
`taskin-task-server-mcp` 0.6.1, `taskin` 5.0.1 e `@opentask/taskin` 3.0.16.

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
