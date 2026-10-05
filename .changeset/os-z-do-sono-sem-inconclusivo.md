---
'@opentask/taskin-design-vue': patch
---

Os tres "Z" do humor `sleeping` (`TaskinEffectZzz`) deixam de sair
inconclusivos no `color-contrast` do axe (o painel de acessibilidade do
Storybook dizia "conteudo curto demais"): sao decorativos, e passam a ser
desenhados como `<path>` com o contorno do glifo que o `<text>` desenhava, em
vez de `<text>`. O desenho nao muda.
