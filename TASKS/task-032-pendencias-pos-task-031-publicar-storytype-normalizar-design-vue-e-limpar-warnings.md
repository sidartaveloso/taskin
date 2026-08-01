# Task 032 — Pendencias pos task-031: publicar storytype, normalizar design-vue e limpar warnings

Status: pending
Type: chore
Assignee: sidarta-veloso

## Description

Reune as pendencias deixadas em aberto durante a task-031: publicar storytype@0.2.6, aplicar o normalize no design-vue, decidir os bumps do changeset e limpar warnings de lint conhecidos.

Nada aqui bloqueia o funcionamento atual. São decisões adiadas e limpezas que ficaram
registradas durante a task-031 em vez de serem feitas na hora, para não inflar o
escopo daquele refactor.

## Ordem sugerida

Os três primeiros blocos têm dependência entre si:

```
publicar storytype@0.2.6  →  normalizar design-vue  →  changeset/release
```

O normalize depende da versão publicada (o taskin usa `@storytype/cli@0.2.4` do npm,
sem os fixes), e a renomeação de 27 arquivos deve entrar antes de fechar as versões.

## Tasks

### 1. Publicar `storytype@0.2.6`

- [ ] Publicar a partir do `storytype` (branch `develop`, commits `df2fe4b` e `990561a`)
- [ ] Atualizar a devDependency no taskin de `^0.2.6` para a versão publicada
- [ ] Confirmar que `pnpm storytype normalize --dry-run` no design-vue passa a
      reportar as mudanças (com o `0.2.4` reporta 0)

### 2. Normalizar `packages/design-vue`

Validado em dry-run na Fase 4 da task-008 do storytype: **27 arquivos a renomear,
90 imports a atualizar, 0 divergências** entre audit e normalize.

- [ ] Rodar `pnpm storytype normalize src/components` em `packages/design-vue`
- [ ] Conferir que os `index.ts` dos diretórios afetados tiveram os imports reescritos
- [ ] Rodar `pnpm build && pnpm typecheck && pnpm test` — a renomeação toca
      `taskin-effect-*`, `taskin-tentacle*` e `taskin.controller.ts`
- [ ] Commit separado da renomeação, para o diff ficar legível na revisão
- [ ] Conferir que `git log --follow` segue nos arquivos renomeados

### 3. Decidir os bumps do changeset

O changeset `generic-task-provider-and-paused-status` marca `design-vue` e
`task-server-ws` como `major`. Em pacote 0.x isso promove direto para **1.0.0**:

| Pacote | Atual | Com `major` | Com `minor` |
| --- | --- | --- | --- |
| `@opentask/taskin-design-vue` | 0.1.1 | **1.0.0** | 0.2.0 |
| `@opentask/taskin-task-server-ws` | 0.2.1 | **1.0.0** | 0.3.0 |

- [ ] Decidir se 1.0.0 é intencional (é uma declaração de estabilidade pública) ou
      se troca para `minor`, que é a convenção de "breaking" em 0.x
- [ ] Os demais majors não têm essa ambiguidade e podem ficar como estão:
      `task-manager` 2.0.1 → 3.0.0, `types-ts` 1.1.1 → 2.0.0, `pinia` 2.0.1 → 3.0.0

### 4. Limpar warnings de lint

`pnpm lint` passa (exit 0) — são 97 warnings, nenhum erro. Destes, ~52 fora de
arquivos de teste.

- [ ] Converter os 5 comentários `eslint-disable` órfãos para `biome-ignore`, sobra
      da migração para Biome (o Biome não lê o formato antigo). Derruba 4 dos 7
      warnings de produção sem tocar em código:
      - `packages/cli/src/commands/define-command/define-command.types.ts`
      - `packages/ui-sense/src/composables/use-pose-landmarker.ts`
      - `packages/ui-sense/src/composables/use-gesture-recognizer.ts`
      - `packages/ui-sense/src/composables/use-face-landmarker.ts`
      - `packages/utils/src/security.test.ts`
- [ ] Tipar os 2 `any` evitáveis do design-vue: `taskin-tentacle.ts:151`
      (`{ slots }: any` → `SetupContext`) e `taskin-tentacles-fluid.ts:94`
      (`h(TaskinTentacle as any)`)
- [ ] Os 23 `noBannedTypes` (`{}` nos `.types.ts`) ficam para quando o storytype
      preencher esses arquivos — ver Notes

### 5. Corrigir o regex de titulo em `findTask`

- [ ] O padrão `/^# .*Task.*?[—-]\s*(.+)$/im` casa gulosamente quando o título contém
      "task". Em `# Task 031 — revisar se task-manager deveria...` o título extraído
      vira `manager deveria lidar com taskfile ou task`, perdendo o prefixo
- [ ] Afeta a mensagem do commit gerado por `taskin finish` (`chore(task-NNN): <titulo>`)
- [ ] Adicionar teste com título contendo a palavra "task"

## Notes

- **Os `{}` dos `.types.ts` não devem ser deletados.** Chegou-se a considerar
  remover os 8 arquivos por parecerem scaffold morto, mas o `storytype normalize`
  os usa como destino: ele move os props do bloco `<script setup>` do `.vue` para
  o `.types.ts` irmão, como já foi feito no `Avatar`. São o alvo da convenção, não
  lixo.
- **Sobre trocar `{}` por outra coisa**: `Record<string, never>` é o reflexo comum
  mas tem dois defeitos medidos — uma `interface` vazia não é atribuível a ele
  (index signature implícita não existe em interfaces), e ler qualquer chave
  devolve `never` em silêncio. O padrão do `type-fest` com símbolo branded
  (`{ [emptyBrand]?: never }`) não tem nenhum dos dois. O próprio Biome sugere
  essa alternativa na mensagem da regra.
- **A saída do `storytype normalize` não passa no lint do repo.** No `Avatar` foram
  necessários dois ajustes: `;` faltando ao converter `interface` em `type`, e
  `import type` no `.vue` (regra `useImportType`). Prever um `biome check --write`
  depois de normalizar os demais.
- **O brand do `TaskId` continua quebrado** e fica fora desta task: o schema é
  `z.string().uuid().brand('TaskId')`, mas os ids reais são sequenciais (`001`),
  então todo provider faz `satisfies string as TaskId`. Decidir se id é uuid ou
  sequência é modelagem de domínio, não limpeza.
- PR da task-031: https://github.com/sidartaveloso/taskin/pull/3 (base `develop`,
  não `main` — a `main` está 83 commits atrás)
