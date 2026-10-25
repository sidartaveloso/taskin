---
'@opentask/taskin-design-vue': minor
---

`TaskinSays`: o balao de fala em HTML, fora do SVG do mascote. O balao em SVG
escala com o desenho e, no tamanho de um chat, nao se le; este envolve o
`Taskin`, poe o texto num balao ancorado a cabeca com fonte em pixels de
verdade, quebra natural e cores trocaveis pelas variaveis `--taskin-says-*`, e
repassa as outras props e o `play()`.
