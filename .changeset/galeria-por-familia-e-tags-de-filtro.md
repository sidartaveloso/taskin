---
'@opentask/taskin-design-vue': patch
'@opentask/ui-sense': patch
---

A galeria ganha familia dentro do nivel atomico, e tags de filtro

Com os dois pacotes na mesma arvore, `Atoms` passou a reunir onze itens de tres
familias sem relacao — `Badge` ao lado de `TaskinMouth` e de `WebcamVideo`. O
nivel atomico diz quao composto algo e, e ninguem navega por isso.

O nivel continua sendo a espinha e a familia entra dentro dele: `Base` (UI
generica), `Task` (o produto), `Taskin` (o mascote) e `Sense` (os sensores).
Assim o titulo continua espelhando o caminho do arquivo — que e o que alguem usa
para achar o codigo — em vez de criar uma segunda taxonomia por dominio.

Junto vem cinco tags, no filtro da barra lateral, para os eixos que uma arvore
nao expressa (um componente mora em uma pasta so):

| tag | o que diz |
| --- | --- |
| `design-vue` · `ui-sense` | de qual pacote o componente vem |
| `webcam` · `microphone` | a story pede permissao de dispositivo |
| `legacy` | superado, mantido para referencia — fora da sidebar por padrao |

`webcam` e a que mais rende: descobrir quais das 303 stories abrem a camera
exigia clicar e tomar erro. Onde so uma story de um arquivo estatico depende do
dispositivo, a tag fica na story e nao no meta, senao o filtro mentiria sobre as
outras.

**As URLs mudam.** E alteracao so de titulo — nenhum componente, nenhum import,
nenhuma suite afetada — mas quem tiver
`/components/?path=/story/atoms-avatar--default` salvo passa a precisar de
`atoms-base-avatar--default`.
