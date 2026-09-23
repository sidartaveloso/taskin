# Task 026 — Normalizar ao padrão storytype

- Status: in-progress
- Type: refactor
- Assignee: sidartaveloso
- Priority: 1012
- Difficulty: 5

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

- [x] Rodar `pnpm storytype normalize src/components --dry-run` em
      `packages/design-vue` e revisar a lista inteira antes de aplicar
- [x] Separar, na lista, o que é convenção real do que é falso positivo do
      detector (módulo helper tratado como componente)
- [ ] Aplicar a renomeação em commit próprio, sem misturar com mudança de
      conteúdo, para o `git log --follow` continuar seguindo
- [ ] Conferir os `index.ts` dos diretórios afetados e os 102 imports reescritos
- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm test` do `design-vue` verdes depois
- [ ] Rodar o dry-run de novo até sobrar só o que foi recusado de propósito
- [ ] Changeset de `@opentask/taskin-design-vue`: os caminhos de import do pacote
      mudam, então quem depende dele vê diferença


### A revisão do dry-run (16/09), e por que a aplicação foi revertida

O dry-run propõe **20 componentes** em 16 pastas novas. A lista de destinos está
correta — `avatar/`, `badge/`, `progress-bar/`, `day-bar/`, `task-card/`,
`task-grid/` e afins são todos componentes de verdade. **Nenhum módulo helper
foi tratado como componente**, que era o falso positivo previsto.

O falso positivo real e outro, e o dry-run nao o mostra: **`organisms/taskin/`
ja era uma pasta de familia**, com cinco componentes dentro (`Taskin`,
`TaskinV1`, `TaskinWithShhh`, `TaskinWithFaceTracking`,
`TaskinWithFullTracking`). O tool tratou-a como diretorio plano e **aninhou mais
um nivel**, gerando `organisms/taskin/taskin/`, `organisms/taskin/taskin-v1/`…
O certo seria achatar para `organisms/taskin/` e `organisms/taskin-v1/`.

A aplicacao foi feita e **revertida**. Tres problemas apareceram, em ordem:

1. **O aninhamento acima**, corrigido a mao.
2. **Imports fora do escopo varrido.** O tool so reescreve dentro de
   `src/components`; o `src/index.ts` do pacote, que exporta a familia inteira,
   ficou apontando para caminhos que deixaram de existir. O barrel de
   `organisms/taskin/` tambem foi substituido por um de componente unico,
   perdendo as exportacoes nomeadas.
3. **Regressao de teste.** Quatro specs de `templates/` passavam antes e
   falharam depois (`Cannot read properties of undefined`), e a causa exige
   entender resolucao de modulo numa arvore inteira movida — provavelmente um
   import que passou a resolver para **outro** arquivo existente, e por isso nao
   apareceu como erro de compilacao.

São 109 arquivos. Nao e mudanca para empurrar sem entender o item 3.

### O que fazer quando alguem retomar

O caminho tem duas partes, e a primeira nao depende deste repositorio:

**Corrigir o `storytype`** para reconhecer uma pasta de familia e achatar em vez
de aninhar, e para varrer os imports do pacote inteiro — nao so do diretorio
alvo. Enquanto isso nao existir, cada aplicacao exige o mesmo trabalho manual.

**Aplicar em lotes**, e nao de uma vez: uma pasta por commit, com
`pnpm test` do `design-vue` entre cada uma. Foi o tudo-de-uma-vez que tornou a
regressao dificil de isolar.

## Notes

- Sem vínculo com o cluster de gestos (tasks 022–025, 027).
- A task-032 cobre o resto das pendências da task-031 e está fechada; o que
  sobrou dela para cá é só este normalize.
- Lição que vale além desta task: `--dry-run` vazio não prova que o trabalho foi
  feito. Ferramenta desatualizada produz exatamente o mesmo zero.
