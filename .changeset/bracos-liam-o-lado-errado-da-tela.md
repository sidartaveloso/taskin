---
'@opentask/ui-sense': patch
'@opentask/taskin-design-vue': patch
---

Os bracos do mascote paravam de cruzar o corpo

A task-044 consertou o espelhamento do angulo e deixou passar o que vinha antes
dele: **de qual metade da tela cada braco era lido.**

Os indices do MediaPipe Pose sao nomeados pelo corpo do **sujeito**, e uma
pessoa de frente para a camera tem o ombro esquerdo dela na **direita** da
imagem — `LEFT_SHOULDER` (11) sai com `x` grande. O `ARM_LANDMARKS` tratava
`11` como lado esquerdo da tela, entao cada braco era medido de um lado e
pintado no ombro oposto: quem abria os bracos virava um mascote se abracando.

O `mirrorPose` nao muda isso e foi o que despistou. Ele inverte `x` e depois
troca os pares, e as duas operacoes se cancelam do ponto de vista da tela: o
indice `11` cai na direita da imagem nos dois modos. O que a troca muda e de
quem e o ponto, nao onde ele esta — por isso o mapeamento agora e
incondicional, em vez de depender do flag.

Medido com a pessoa de bracos erguidos e abertos: antes, o cotovelo esquerdo era
desenhado em `x=112.7` com o ombro em `x=95` — para dentro. Agora cai em `x=77`,
para fora.

### Por que a suite nao pegou

Cada peca tinha teste e cada peca estava certa. `armAnglesFromLandmarks` media
os quatro quadrantes, `armPositionFromPose` convertia os dois espacos,
`TaskinArms` renderizava. Nenhum atravessava da landmark crua ate o pixel, e o
fixture dos testes montava `11` na esquerda da tela — fixando a convencao errada
que o codigo de producao seguia.

Entra um teste que faz o caminho inteiro, nos dois modos de espelhamento, e
falha se os indices voltarem a trocar.
