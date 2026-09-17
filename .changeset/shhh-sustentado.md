---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': minor
---

O pedido de silêncio agora pode exigir barulho sustentado

`onNoiseAbove` passa a aceitar `{ sustainMs, debounceMs }` como terceiro
argumento: o nível precisa se manter acima do limiar por `sustainMs`
milissegundos seguidos antes do primeiro disparo. Antes, uma única amostra alta
bastava — uma porta batendo pedia silêncio igual a um minuto de conversa alta.

Os dois tempos respondem a perguntas diferentes e são independentes:
`sustainMs` conta antes do primeiro pedido, `debounceMs` conta a partir dele até
o próximo. Uma amostra abaixo do limiar zera a contagem, então a sustentação é
contínua.

O padrão é `0`, que preserva o comportamento atual. O terceiro argumento
numérico continua significando `debounceMs`, então nada que já existia muda.
`TaskinWithShhh` ganhou a prop `noiseSustainMs` e `NoiseTrackingControls` ganhou
o campo correspondente, ajustável ao vivo.
