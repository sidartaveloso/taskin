---
'@opentask/taskin-design-vue': patch
---

Poe as stories sob o typecheck, e conserta os 131 erros que o `exclude` escondia.

O tsconfig do design-vue excluia `src/**/*.stories.ts`, entao nenhum erro de tipo
em story era visto. A lacuna deixou passar uma regressao de verdade: um bloco de
story passou a chamar uma funcao sem o import, e nem o typecheck nem a suite
storybook (quebrada por outro motivo) viram — o erro so apareceu quando alguem
abriu a story no navegador.

Removido o `exclude`, apareceram 131 erros. A maioria nao era ruido de tipagem:

- **20 componentes eram objeto literal** (`export default {`) em vez de
  `defineComponent(...)`. Sem isso o Vue nao infere props e o Storybook resolve
  `ArgTypes` contra o objeto de definicao.
- **10 componentes tinham anotacao manual de `props:` no `setup`**, que
  sobrescrevia a inferencia e mentia: o `TaskinTentacle` declarava `side` e
  `index` como obrigatorias sem que existissem no bloco `props`.
- **`TaskinArmWithPhone.stories` usava nomes de prop que o componente nao tem
  mais** (`phoneColor`, `screenColor`, `phoneOnLeft`, `phoneOnRight`): ele foi
  renomeado e a story nunca acompanhou.
- Fixtures de story com `TaskId` como `string` cru, indices de array sem guarda
  sob `noUncheckedIndexedAccess`, e props obrigatorias ausentes no `meta.args`.

Sem mudanca de comportamento: as 209 suites do pacote seguem passando.

Junto disso, a suite `storybook` do pacote voltou a rodar: `aria-query` e CJS sem
campo `exports`, o pre-bundle do Vite no modo browser nao detectava seus named
exports e o setup do `@storybook/addon-vitest` quebrava com "does not provide an
export named 'elementRoles'". `optimizeDeps.include: ['aria-query']` resolve —
37 arquivos e 232 testes que nao executavam voltaram.
