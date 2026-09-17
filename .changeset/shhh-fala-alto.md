---
'@opentask/taskin-types': minor
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': minor
---

O "shhh" do Taskin agora sai som, e a frase pode ter nome.

O caso de uso é concreto: o mascote fica no celular, tela ligada, virado para
quem programa. Quando alguém fala alto na sala, é ele quem pede silêncio, em vez
de a pessoa ter de interromper o próprio trabalho. Um balão na tela não resolve
— quem está falando não está olhando para a tela.

Até aqui `sound` era um interruptor inerte: o código tinha um comentário dizendo
que não havia áudio. Agora `sound: true` produz duas camadas, e a segunda nunca
falta:

- **a fala**, pelo `speechSynthesis` do próprio navegador, que diz a frase
  inteira — é daí que vem poder dirigir o pedido a alguém;
- **o chiado**, sintetizado com Web Audio: ruído branco por um filtro de banda
  alta, que é literalmente o que uma sibilante é. Nenhum arquivo de áudio para
  baixar, licenciar ou versionar, funciona sem rede, e a duração acompanha os
  `h` da frase.

`phrase` e `volume` entram no bloco `mascot.reactions.noise` do `.taskin.json` e
como props `shhhPhrase`/`shhhVolume` do `TaskinWithShhh`.

Junto vieram duas correções que o caso revelou. O `Taskin` recebia
`showThoughtBubble` e `thoughtBubbleText` e **ignorava os dois** — o balão só
existia no humor `thoughtful`, sempre com o mesmo `?`; agora as props mandam na
configuração do humor. E a prop `mascot` pedia `MascotConfig`, o tipo com os
defaults já aplicados, o que obrigava quem só queria ligar o som a escrever
também limiar, debounce e volume; passou a pedir o novo `MascotConfigInput`, que
é o bloco como se escreve.

`TASKIN_MOODS` passa a ser exportado: a lista de humores existe como valor, e o
tipo `TaskinMood` deriva dela.
