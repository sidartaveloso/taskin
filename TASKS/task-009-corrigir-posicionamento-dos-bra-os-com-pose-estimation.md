# Task 009 — Corrigir posicionamento dos braços com pose estimation

- Status: done
- Type: fix
- Assignee: Sidarta Veloso

## Description

O posicionamento está incorreto, considerando o pose estimation.

## Tasks

- [x] Criar gabarito para o pose estimation
- [x] Ajustar o posicionamento conforme gabarito
- [x] Adicionar testes

## Notes

Entregue pela task-044, que diagnosticou a causa: `getArmAngles()` devolvia
ângulo **absoluto na tela** e o `TaskinArms` tratava o mesmo número como ângulo
**relativo ao lado do corpo**, espelhando de novo com um fator `-1` só no braço
esquerdo. O direito acertava por coincidência de quadrante.

O "gabarito" virou tipo, não documento: `ScreenAngle` e `SideRelativeAngle` em
`packages/ui-sense/src/utils/arm-angle.ts`, com `mirrorAngleForSide` como única
fronteira entre os dois espaços — passar a saída da pose direto para o desenho
deixou de compilar. O cálculo saiu do composable para `armAnglesFromLandmarks`
(puro), e `ArmPosition` passou a ter duas direções (`shoulderAngle` +
`forearmAngle`), o que resolveu de uma vez o `wristAngle` morto e a escala
invertida do `elbowAngle`.

Testes: `arm-angle.spec.ts`, `arm-angles.spec.ts` e `arm-position-from-pose.spec.ts`,
cobrindo os quatro quadrantes de cada lado em vez de só a pose neutra.

## Reabertura — o lado da tela

O conserto da task-044 foi real, mas parcial: ele arrumou o **angulo** e deixou
passar o que vinha antes dele, **de qual metade da tela cada braco era lido**.

Os indices do MediaPipe Pose sao nomeados pelo corpo do sujeito. Uma pessoa de
frente para a camera tem o ombro esquerdo dela na direita da imagem, entao
`LEFT_SHOULDER` (11) sai com `x` grande. O `ARM_LANDMARKS` tratava `11` como
lado esquerdo da tela: cada braco era medido de um lado e pintado no ombro
oposto. Com os bracos abertos, o mascote se abracava.

O `mirrorPose` foi o que despistou. Ele inverte `x` e depois troca os pares, e
as duas operacoes se cancelam do ponto de vista da tela — o indice `11` cai na
direita da imagem nos dois modos. O que a troca muda e de quem e o ponto, nao
onde ele esta. Por isso o mapeamento ficou incondicional em vez de depender do
flag.

Medido com a pessoa de bracos erguidos e abertos: o cotovelo esquerdo era
desenhado em `x=112.7` com o ombro em `x=95` — para dentro. Depois do conserto
cai em `x=77`, para fora.

### Por que a suite nao pegou, de novo

Cada peca tinha teste e cada peca estava certa. Nenhum teste atravessava da
landmark crua ate o pixel, e os fixtures montavam `11` na esquerda da tela —
fixando no teste a mesma convencao errada que a producao seguia. Testes verdes
sobre a metade errada da cena.

Entrou um teste que faz o caminho inteiro — landmarks, espelhamento, conversao
de espaco, `mount` do `TaskinArms` e leitura do ponto de controle `Q` do path —
nos dois modos de espelhamento. Verificado por sabotagem: com os indices
trocados de volta, ele falha com `expected 112.67 to be less than 95`.

### Um segundo defeito, achado ao validar

Com os indices corrigidos, o mascote parou de mexer os bracos **e** o painel de
debug sumiu. Nao era regressao do conserto acima — o painel depende dos
blendshapes do rosto, que esta correcao nao toca. Dois detectores mortos ao
mesmo tempo apontavam para a camera, nao para a geometria.

O `TaskinWithFullTracking` roda face e pose sobre o mesmo `<video>`, e cada
composable abria a propria camera. O stream orfao era o problema menor; o que
travava era uma linha:

```ts
videoElement.onloadedmetadata = () => resolve();
```

`onloadedmetadata` e **propriedade, nao lista**. A segunda atribuicao apagava a
primeira, entao quem chegou antes nunca recebia o callback, ficava preso no
`await` para sempre e jamais comecava a detectar — sem erro, sem log. Qual dos
dois travava dependia de quem carregava o modelo primeiro, o que fez o defeito
ir e vir sem ninguem mudar nada.

Consertado com `attachCamera` no `@opentask/ui-sense`: uma camera por elemento,
com contagem de referencias, espera por `addEventListener(..., { once: true })` e
tolerancia ao `AbortError` de `play()` interrompido. Changeset proprio, porque e
defeito de outra natureza.

### Confirmado

Validado na story `Organisms/Taskin/Full Tracking` -> `Debug Mode`, com camera
de verdade.

