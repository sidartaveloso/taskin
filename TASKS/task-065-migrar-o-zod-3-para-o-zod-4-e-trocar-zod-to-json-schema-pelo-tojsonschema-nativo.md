# 🧩 Task 065 — Migrar o zod 3 para o zod 4 e trocar zod-to-json-schema pelo toJSONSchema nativo

- Status: pending
- Type: chore
- Assignee: To be defined

## Description

Três pacotes (`cli`, `types-ts`, `utils`) declaravam `zod@^3.25.76` enquanto a
raiz já estava em `^4.5.4` — duas versões convivendo. E a geração de JSON Schema
usava `zod-to-json-schema`, pacote de terceiro que mira o zod 3.

O gatilho veio de fora: no geohub, ao desenhar a geração TS→Python (RDT-013 de
lá), o `zod-to-json-schema` foi testado contra um schema zod 4 e devolveu `{}`
**vazio**. É o pior tipo de falha — um arquivo que parece gerado e não descreve
nada. O zod 4 tem `z.toJSONSchema()` nativo, então o pacote sai de cena.

## O que mudou

- `zod` `^3.25.76` → `^4.5.4` nos três pacotes; `zod-to-json-schema` removido;
- `z.record(z.unknown())` → `z.record(z.string(), z.unknown())` — o zod 4 exige o
  tipo da chave (`taskin.schemas.ts:474`, **único** erro de compilação dos 35
  schemas);
- `result.error.errors` → `result.error.issues` (`utils/src/security.ts:229`);
- `generate-schemas.ts` passa a usar `z.toJSONSchema()`.

As formas depreciadas — `.email()` (2), `.url()` (3), `z.string().datetime()`
(10) — **continuam funcionando** no zod 4 e não foram tocadas. Migrá-las para
`z.email()`, `z.url()` e `z.iso.datetime()` é limpeza separada.

## A verificação

Os schemas gerados foram capturados **antes** de qualquer alteração e comparados
campo a campo depois:

```
task.schema.json: perdeu 0 | ganhou 2 | mudou 0
user.schema.json: perdeu 0 | ganhou 1 | mudou 0
```

Os três ganhos são `pattern` — o zod 4 emite a regex de validação ao lado do
`format` para `date-time` e `email`. Nada foi perdido, nenhum valor mudou.

Chegar a zero exigiu duas opções que **não** são default e sustentam o
resultado, ambas documentadas no próprio script:

- `target: 'draft-7'` — o zod 4 emite draft 2020-12 por padrão. O consumidor é o
  `datamodel-code-generator` do `types-py`, e trocar de draft é decisão separada
  de trocar de gerador;
- `io: 'output'` — com `'input'` o zod **omite `additionalProperties: false`**,
  porque um valor de entrada pode trazer chaves extras que o `z.object()`
  descarta. Essa flag é o que vira `extra='forbid'` no pydantic; `'input'`
  transformaria modelos estritos em permissivos, em silêncio.

## Um achado que não era o objetivo

Os testes do `packages/utils` **não estavam exercitando o fonte**.

`security.test.ts` importa `from './security'` sem extensão, e a ordem de
resolução do vitest põe `.js` antes de `.ts`. Havia um `security.js` compilado
**versionado dentro de `src/`**, vindo de um `chore: release packages` antigo —
ele sombreava o `security.ts`.

Descobri porque corrigi `.errors` → `.issues` no `.ts`, o typecheck passou e o
teste continuou falhando com o erro antigo.

O `.gitignore` **já ignora** `**/src/**/*.js` e `**/src/**/*.d.ts`; os 8 arquivos
foram versionados antes da regra existir. Removidos. Com isso o `utils` passa a
rodar 110 testes contra o fonte de verdade.

## Tasks

- [x] `zod` 4 nos três pacotes, `zod-to-json-schema` removido
- [x] Dois erros reais corrigidos (`z.record` de um argumento, `ZodError.errors`)
- [x] `generate-schemas.ts` usando `z.toJSONSchema()` com `draft-7` e `io: 'output'`
- [x] Schemas comparados contra a baseline: zero perda, zero mudança de valor
- [x] Artefatos compilados removidos de `packages/utils/src/`
- [x] `pnpm typecheck` (27/27) e `pnpm test` (42/42) verdes
- [ ] Limpeza separada: `.email()`/`.url()`/`z.string().datetime()` para as formas
      novas do zod 4
- [ ] Verificar se outros pacotes têm artefato compilado versionado sombreando
      fonte — o `utils` foi achado por acaso

## Notes

**`pnpm lint` não passa nesta branch, e não passava antes.** O erro é de
formatação em `.claude/launch.json`, arquivo idêntico ao HEAD e não tocado aqui
(confirmado com `git diff --quiet HEAD`). Não foi corrigido junto para não
misturar assunto no commit da migração.

O `.sandcastle/main.ts` estava modificado na árvore quando esta branch nasceu, de
outro trabalho em curso, e **não** foi commitado aqui.
