# Task 026 — Normalizar ao padrão storytype

- Status: in-progress
- Type: refactor
- Assignee: sidartaveloso
- Priority: 70

## Description

Aplicar o `storytype normalize` ao `packages/design-vue`, agora com a versão
certa da ferramenta.

A task-032 deu este bloco por fechado com base num `--dry-run` que não pedia
nenhuma renomeação. Aquele zero foi medido com `@storytype/cli@0.2.4`, que
enxergava 13 dos 36 componentes do pacote — era a versão sem o fix de detecção
que a própria task-032 existia para publicar. Com `storytype@0.4.0` instalado, a
medição verdadeira aparece.

## O que o dry-run pede hoje

```
Componentes encontrados: 36
Diretórios a renomear: 0
Componentes a mover para pasta própria: 20
Arquivos a renomear: 61
Arquivos a criar: 42
Imports a atualizar: 102
```

A convenção da 0.4.0 é **uma pasta por componente**, com `index.ts` próprio. O
`Avatar`, por exemplo, sai de quatro arquivos soltos em `atoms/` para
`atoms/avatar/{Avatar.vue,Avatar.types.ts,Avatar.stories.ts,Avatar.test.ts,index.ts}`.
Os 20 que faltam estão em `atoms/` e `templates/`; os organisms e moléculas já
seguem a forma, de `7eb07bb` e `cb35884`.

Os 42 arquivos a criar são em boa parte `index.ts` de barril, mas o detector
também quer `.types.ts` e `.spec.ts` para módulos que não são componentes — o
mesmo falso positivo que a task-032 registrou para `Taskin.controller.ts`.
Conferir um a um antes de aceitar: scaffold vazio versionado é pior que ausência.

## Tasks

- [ ] Rodar `pnpm storytype normalize src/components --dry-run` em
      `packages/design-vue` e revisar a lista inteira antes de aplicar
- [ ] Separar, na lista, o que é convenção real do que é falso positivo do
      detector (módulo helper tratado como componente)
- [ ] Aplicar a renomeação em commit próprio, sem misturar com mudança de
      conteúdo, para o `git log --follow` continuar seguindo
- [ ] Conferir os `index.ts` dos diretórios afetados e os 102 imports reescritos
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm test` do `design-vue` verdes depois
- [ ] Rodar o dry-run de novo até sobrar só o que foi recusado de propósito
- [ ] Changeset de `@opentask/taskin-design-vue`: os caminhos de import do pacote
      mudam, então quem depende dele vê diferença

## Notes

- Sem vínculo com o cluster de gestos (tasks 022–025, 027).
- A task-032 cobre o resto das pendências da task-031 e está fechada; o que
  sobrou dela para cá é só este normalize.
- Lição que vale além desta task: `--dry-run` vazio não prova que o trabalho foi
  feito. Ferramenta desatualizada produz exatamente o mesmo zero.
