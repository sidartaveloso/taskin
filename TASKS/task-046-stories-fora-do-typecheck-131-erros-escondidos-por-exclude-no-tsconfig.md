# 🧩 Task 046 — Stories fora do typecheck: 131 erros escondidos por exclude no tsconfig

Status: pending
Type: chore
Assignee: Sidarta Veloso

## Description
O tsconfig do design-vue exclui src/**/*.stories.ts, entao nenhum erro de tipo em story e visto. Removendo o exclude aparecem 131 erros em 20+ arquivos. A causa raiz da maioria e componente exportado como objeto literal em vez de defineComponent, o que impede o Vue de inferir props e faz o Storybook resolver ArgTypes contra o objeto de definicao.

## Tasks

- [x] Remover `src/**/*.stories.ts` do `exclude` do tsconfig do design-vue
- [x] Causa raiz: 20 componentes exportados como objeto literal (`export default {` ou
      `export const X = {`) em vez de `defineComponent(...)`. Sem isso o Vue nao infere props e o
      Storybook resolve `ArgTypes` contra o objeto de definicao — 39 erros de "prop nao existe em
      ArgTypes" sairam de uma vez
- [x] Remover as anotacoes manuais de `props:` no `setup(...)` de 10 componentes: elas
      sobrescreviam a inferencia e **mentiam**. O `TaskinTentacle` declarava `side` e `index` como
      obrigatorias sem que existissem no bloco `props` — props fantasma que ninguem passava
- [x] `TaskId` branded nas fixtures de story (`TaskCard`, `TaskGrid`, `Dashboard`,
      `PrioritizationPage`, `PrioritizationScreen`): usavam `string` cru
- [x] Guardas de indice sob `noUncheckedIndexedAccess` em play functions (`e.touches[0]`,
      `groups[0]`, `subGroups[0]`)
- [x] Props obrigatorias fornecidas no `meta.args` de `DayBar`, `ProjectBreadcrumb`, `TaskHeader`
      e `TimeEstimate`, para as stories que so definem `render` proprio herdarem
- [x] `TaskinArmWithPhone.stories`: usava `phoneColor`, `screenColor`, `phoneOnLeft` e
      `phoneOnRight`, nomes que o componente **nao tem mais** — foi renomeado e a story nunca
      acompanhou. Os controles `phoneOffsetX/Y` viraram par left/right e sairam
- [x] `Taskin.stories`: cast manual `as {...} & ThisType<{...}>` no `methods` trocado por
      `defineComponent`, que tipa o `this` do Options API sem remendo
- [x] Verificar: 0 erros de tipo com as stories incluidas, 209 testes do design-vue e 68 do
      ui-sense verdes

## Notes

- Saiu de **131 erros para 0**. A maioria nao era ruido de tipagem: eram defeitos reais que o
  `exclude` escondia — stories passando props que nao existem, fixtures com `TaskId` cru, props
  fantasma declaradas a mao no `setup`.
- Descoberta pelo caminho, e o motivo da task existir: a lacuna deixou passar uma regressao de
  verdade. A task-044 trocou blocos de story por `armPositionFromPose(...)` **sem o import**, e
  nem o typecheck (stories excluidas) nem a suite storybook (quebrada pelo `aria-query`) viram. O
  erro so apareceu quando um humano abriu a story.
- Nao mexer em `.vue` com `<script setup>`: o bloco `<script>` extra que so define `name` deve
  ficar como objeto literal. Envolve-lo em `defineComponent` faz o TS resolver o componente **sem
  props**, porque o tipo passa a vir dali em vez do `<script setup>`.
- Segue vermelha, por motivo alheio: a suite `storybook` do design-vue, por `aria-query@5.3.0` nao
  expor `elementRoles` ao setup do `@storybook/addon-vitest`. Provavel fallout do bump de vite 8;
  ver task-045, que reporta familia parecida no build do docs.
