---
'@opentask/taskin-design-vue': patch
---

O Storybook da raiz vira um so, em vez de compor dois

A raiz compunha os Storybooks dos pacotes por `refs`, apontando para os
servidores de cada um. Funcionava, mas exigia tres servidores no ar para ver uma
galeria, e a navegacao nascia partida em duas secoes — abrir a raiz abria, na
pratica, dois Storybooks. Agora ela varre os dois pacotes e monta uma arvore so:
`Atoms/Avatar` (design-vue) fica ao lado de `Atoms/GestureIcon` (ui-sense), que e
como um design system se le.

Os Storybooks por pacote continuam existindo e nao viraram copia morta: sao eles
que rodam o `addon-vitest` — as play functions em navegador de verdade — e e o do
`design-vue` que o deploy publica em `/components`.

O `preview.ts` da raiz nao repete as regras: reaproveita o do `design-vue`, que e
superconjunto do do `ui-sense`. So o `storySort` fica literal la, porque o
Storybook le esse campo por analise estatica e um valor herdado por spread vira
`Identifier` para o parser — a sidebar cai em ordem alfabetica sem nenhum erro
visivel.
