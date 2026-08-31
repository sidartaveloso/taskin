# Task 032 — Pendencias pos task-031: publicar storytype, normalizar design-vue e limpar warnings

Status: in-progress
Type: chore
Assignee: sidarta-veloso

## Description

Reune as pendencias deixadas em aberto durante a task-031: publicar storytype@0.2.6, aplicar o normalize no design-vue, decidir os bumps do changeset e limpar warnings de lint conhecidos.

Nada aqui bloqueia o funcionamento atual. São decisões adiadas e limpezas que ficaram
registradas durante a task-031 em vez de serem feitas na hora, para não inflar o
escopo daquele refactor.

## Estado apurado na execucao

Ao levantar o estado real antes de executar, quatro dos cinco blocos ja estavam
resolvidos por commits desta mesma branch. O que sobrou de trabalho real foi so o
bloco 1 — e ele era mais complicado do que o descrito. Ver `## Notes`.

| Bloco | Estado | Evidencia |
| --- | --- | --- |
| 1. Publicar storytype | preparado, falta `npm publish` | commit `16e7438` no repo storytype |
| 2. Normalizar design-vue | ja aplicado | `7eb07bb`, `cb35884`; normalize --dry-run reporta 0 renomeacoes |
| 3. Bumps do changeset | feito | `design-vue` e `task-server-ws` para `minor` |
| 4. Warnings de lint | feito no codigo de producao | `c5927c4`, `63f4b4c`; 97 → 46 warnings, so 1 fora de teste/story |
| 5. Regex de titulo | ja feito | `9225bfa`; teste em `file-system-task-provider.test.ts:69` |

## Ordem sugerida

Os três primeiros blocos têm dependência entre si:

```
publicar storytype  →  normalizar design-vue  →  changeset/release
```

O normalize depende da versão publicada, e a renomeação de arquivos deve entrar
antes de fechar as versões.

## Tasks

### 1. Publicar a cadeia do `storytype`

Não era uma publicação, eram duas — ver `## Notes`.

- [x] Bumpar `@storytype/cli` de `0.2.5` para `0.2.6` (primeira versao com o fix de `df2fe4b`)
- [x] Bumpar o alias `storytype` para `0.2.7` apontando para `^0.2.6`
      (o `0.2.6` do alias ja esta queimado no registry)
- [x] Rebuild limpo do cli — o `dist/` tinha `Cli.d.spec.ts` e `Cli.d.types.ts`
      gerados por um normalize que rodou por engano sobre o build, e `dist` esta
      em `files`, entao iriam junto no pacote
- [x] `pnpm test` e `pnpm typecheck` do cli verdes (106 testes, 3 arquivos)
- [x] `npm pack --dry-run` valida o conteudo do tarball (17 arquivos, sem lixo)
- [x] Confirmar que o cli buildado localmente conserta a deteccao: `audit` no
      design-vue sai de "Diretorio de componentes nao encontrado" para 37 componentes
- [ ] **Bloqueado:** `npm publish` dos dois pacotes — o token do npm em `~/.npmrc`
      esta invalido (`npm profile get` → "authentication token seems to be invalid").
      Precisa de `npm login`
- [ ] Atualizar a devDependency no taskin de `^0.2.6` para `^0.2.7` — so depois de
      publicar, senao `pnpm install` quebra no repo inteiro

### 2. Normalizar `packages/design-vue`

A previsao era 27 arquivos a renomear e 90 imports a atualizar. Com o cli corrigido,
o dry-run reporta **0 diretorios e 0 arquivos a renomear**: a migracao ja tinha sido
aplicada em `7eb07bb` e `cb35884`.

- [x] Rodar `storytype normalize src/components --dry-run` — no-op nas renomeacoes
- [x] Conferir que os `index.ts` dos diretórios afetados tiveram os imports reescritos
- [x] Suite verde apos a renomeacao
- [x] Commit separado da renomeação — foi `cb35884`
- [x] Conferir que `git log --follow` segue nos arquivos renomeados — segue, o
      historico de `TaskinTentacle.ts` volta ate `1271c2a`
- [ ] **Nao aplicado de proposito:** o normalize quer criar
      `Taskin.controller.types.ts` e `Taskin.controller.spec.ts`. `Taskin.controller.ts`
      e um modulo helper que manipula o SVG de forma imperativa, nao um componente;
      os dois arquivos seriam scaffold morto. Falso positivo do detector

### 3. Decidir os bumps do changeset

- [x] Trocado `major` por `minor` em `@opentask/taskin-design-vue` (0.1.1 → 0.2.0) e
      `@opentask/taskin-task-server-ws` (0.2.1 → 0.3.0). Em 0.x, `minor` e a convencao
      para breaking change, e `1.0.0` seria uma promessa de estabilidade publica que o
      design-vue nao esta em condicao de fazer — acabou de ser renomeado inteiro e a
      task-034 traz mais um breaking (`groupId` → `Task.parent`)
- [x] Os demais majors ficam como estao: `task-manager` 3.0.0, `types-ts` 2.0.0,
      `pinia` 3.0.0
- [x] `changeset status` confirma o resultado

### 4. Limpar warnings de lint

Resolvido em `c5927c4` e `63f4b4c` para o codigo de producao. `biome check .` sai de
97 warnings para **46**, sendo 41 `noExplicitAny` e 5 `noTemplateCurlyInString`.
Dos 46, **45 estao em arquivos `.test.ts` / `.stories.ts`** — o unico warning fora de
teste e `packages/ui-sense/src/utils/noise-watcher.ts`. A meta do enunciado eram os
~52 warnings fora de teste; sobrou 1.

- [x] Os `eslint-disable` orfaos foram convertidos — nao ha nenhum `eslint-disable`
      restante em `packages/*/src`. Os tres arquivos `use-*-landmarker.ts` do ui-sense
      citados no enunciado nem existem mais nesses caminhos
- [x] Os 2 `any` do design-vue foram tipados
- [x] Os 23 `noBannedTypes` (`{}` nos `.types.ts`) tambem sumiram — o biome nao
      reporta nenhum hoje. Nao foi preciso decidir sobre `Record<string, never>` nem
      sobre o brand do `type-fest`; as Notes ficam como registro caso o problema volte
- [ ] Os 45 `noExplicitAny` restantes em teste/story e o `noise-watcher.ts` estao
      sendo corrigidos pelo WIP da task-034, que toca exatamente esses arquivos.
      Deixados de fora daqui de proposito, para nao conflitar com aquele trabalho

### 5. Corrigir o regex de titulo em `findTask`

Ja resolvido em `9225bfa`, anterior a abertura desta task.

- [x] O padrao passou a ser `/^#\s+(?:🧩\s+)?Task\s+\d+\s*[—-]\s*(.+)$/im`, ancorado
      no id em vez de gulosamente no `[—-]`. Contra
      `# Task 031 — revisar se task-manager deveria lidar com taskfile ou task`
      o antigo devolvia `manager deveria lidar com taskfile ou task`; o atual devolve
      o titulo inteiro
- [x] Teste com titulo contendo a palavra "task" existe em
      `file-system-task-provider.test.ts:69`

## Notes

- **O bloco 1 escondia um bug de release.** O enunciado dizia "publicar
  storytype@0.2.6", mas esse alias ja estava publicado no npm como `latest` — fixando
  `"@storytype/cli": "0.2.4"`. E o `@storytype/cli` mais recente publicado era o
  `0.2.5`, de 17/06, anterior ao commit `df2fe4b` que traz o fix. Ou seja: o fix nao
  estava em versao nenhuma, e republicar o alias nao resolveria. Por isso viraram
  duas publicacoes, nesta ordem: `@storytype/cli@0.2.6` primeiro, alias `storytype@0.2.7`
  depois.
- **O `pnpm install` no repo do storytype fica quebrado ate a publicacao do cli**,
  porque o alias declara `^0.2.6` literal e o pnpm resolve pelo registry. Uma opcao
  para nao repetir isso e trocar por `workspace:^`, que o `pnpm publish` substitui pela
  versao real na hora de publicar — mas ai o `npm publish` passa a ser proibido no
  repo, porque deixaria `workspace:^` vazar no manifesto publicado.
- **Os `{}` dos `.types.ts` não devem ser deletados.** O `storytype normalize`
  os usa como destino: ele move os props do bloco `<script setup>` do `.vue` para
  o `.types.ts` irmão, como já foi feito no `Avatar`. São o alvo da convenção, não
  lixo.
- **Sobre trocar `{}` por outra coisa**: `Record<string, never>` é o reflexo comum
  mas tem dois defeitos medidos — uma `interface` vazia não é atribuível a ele
  (index signature implícita não existe em interfaces), e ler qualquer chave
  devolve `never` em silêncio. O padrão do `type-fest` com símbolo branded
  (`{ [emptyBrand]?: never }`) não tem nenhum dos dois.
- **O brand do `TaskId` continua quebrado** e fica fora desta task: o schema é
  `z.string().uuid().brand('TaskId')`, mas os ids reais são sequenciais (`001`),
  então todo provider faz `satisfies string as TaskId`. Esta sendo tratado na task-034.
- PR da task-031: https://github.com/sidartaveloso/taskin/pull/3 (base `develop`,
  não `main` — a `main` está 83 commits atrás)
