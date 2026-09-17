---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': minor
---

O mascote chama o nome, faz a pausa e só então chia

As duas camadas do shhh começavam juntas, e a síntese de voz ainda tentava
pronunciar "Shhhhhhhhhhhh..." — saía tudo embolado, e o pedido perdia o
endereço. Agora `shush` fala **apenas o nome**, espera a fala terminar mais um
lapso curto, e só então toca o chiado sintetizado: o ritmo de "Bruno, shhhhh".

`ShhhPedido` ganhou o campo `name`, e `planejarShhh` devolve também o `pausaMs`
entre as duas camadas. A dependência `falar` passou a devolver `Promise<void>`,
resolvida no `onend` da fala — é disso que depende o chiado entrar na hora
certa. Há um teto de espera para o caso de o `onend` não disparar, o que
acontece em alguns navegadores quando a aba perde o foco: o chiado é a camada
que atravessa a sala e não pode ficar refém da fala.

`TaskinWithShhh` ganhou a prop `shhhName`, editável no painel de controles da
story. O balão mostra "nome, frase"; a voz pronuncia só o nome; a `shhhPhrase`
continua definindo a duração do chiado pelos seus `h` e não é mais falada.
