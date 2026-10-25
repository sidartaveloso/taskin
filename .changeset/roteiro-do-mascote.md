---
'@opentask/taskin-design-vue': minor
---

O roteiro do mascote: `useTaskinScript(taskin)` devolve as props reativas
(`mood`, `speechText`, `speaking`, `running`) para ligar no `<Taskin>` e um
`run(steps)` que toca os passos em ordem — troca o humor, toca a acao pelo
`play()` e espera o fim dela, mostra a fala no balao e segura uma pausa
dimensionada pela frase. `stop()` interrompe e limpa a fala; um `run` novo
interrompe o anterior. `scriptDuration(variant, steps)` diz quanto o roteiro
dura sem toca-lo.
