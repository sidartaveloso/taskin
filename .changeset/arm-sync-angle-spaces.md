---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': minor
---

Conserta a sincronizacao dos bracos, marcando no tipo o espaco em que cada
angulo e medido.

Os bracos do mascote nao acompanhavam a pose, e o esquerdo errava mais que o
direito. A causa nao era o tracking: `getArmAngles()` devolvia angulo **absoluto
no espaco da tela** (`atan2` sobre dois landmarks, -180..180) e o `TaskinArms`
tratava o mesmo numero como angulo **relativo ao lado do corpo**, espelhando de
novo com um fator `-1` no braco esquerdo. Com a pessoa de bracos para baixo e
para fora, o ombro direito media 59deg e o esquerdo 121deg; o direito escapava
porque seus angulos caem no primeiro quadrante, onde o fator `+1` nao muda nada,
e o esquerdo tinha o sinal invertido de volta, mandando o cotovelo para dentro do
corpo.

## Os dois espacos existem no tipo

`ScreenAngle` e `SideRelativeAngle` (`Degrees<'screen' | 'sideRelative'>`) sao
`number` com marca. Passar a saida da pose direto para o mascote — o bug — deixa
de compilar, e o mesmo vale para o resultado de uma conversao aplicada duas
vezes, pego no ponto de consumo. Os construtores `screenAngle` e
`sideRelativeAngle` sao o unico jeito de produzir um, e ha teste de tipo
(`@ts-expect-error`) que falha o `typecheck` se a marca parar de valer.

`mirrorAngleForSide(deg, side)` faz a conversao e e sua propria inversa
(`180 - (180 - d) === d`), com overload nos dois sentidos. E a contraparte do
`mirrorPose`, que espelha os landmarks — por isso mora no `ui-sense`.

`armPositionFromPose(angles, side)` e a unica fronteira entre os dois espacos no
lado do desenho, usada pelo organism e pelas stories.

## Braco descrito por duas direcoes

`ArmPosition` era `{ shoulderAngle, elbowAngle, wristAngle }`, com dois problemas:
o `wristAngle` era calculado, propagado e **nunca lido** — nenhum movimento de
antebraco aparecia —, e a escala do `elbowAngle` estava invertida: a pose reporta
o angulo interno da junta (180 = braco esticado), enquanto o desenho o tratava
como desvio do esticado, entao braco reto dobrava o antebraco para tras.

Agora e `{ shoulderAngle, forearmAngle }`, duas direcoes no mesmo espaco — que e
exatamente o que a pose mede e o que o desenho precisa. O helper
`armPosition(shoulder, forearm)` mantem pose escrita a mao legivel.

## Suavizacao pelo arco curto

`smoothAngle(from, to, factor)` interpola pelo caminho mais curto. Interpolar em
linha reta varreria 358deg quando o valor salta de 179 para -179 ao braco passar
da vertical — uma volta inteira na tela por 2deg de movimento real. Tambem e o
que impede o jitter do MediaPipe de chegar cru no SVG.

## Testes

`getArmAngles` nao tinha nenhum, e o `TaskinArms.spec.ts` verificava apenas que
os paths existiam. Agora: o calculo saiu para `armAnglesFromLandmarks`, puro e
testado com poses sinteticas; a geometria do `TaskinArms` e verificada por
quadrante nos dois lados; e ha um teste de integracao pose -> path desenhado que
falha se o espelhamento de um lado for removido — a primeira versao dele passava
com o bug presente, porque a suavizacao de um unico frame partindo do neutro
escondia o erro.

## Breaking changes

**`@opentask/ui-sense`**

- `ArmAngles` mudou de lugar (`./arm-angles`, reexportado no barrel) e seus
  campos `shoulder`/`wrist` agora sao `ScreenAngle`, nao `number`. `elbow` segue
  `number`: e angulo interno, nao direcao.
- `getArmAngles()` devolve o novo tipo. O calculo esta em
  `armAnglesFromLandmarks`, exportado e puro.

**`@opentask/taskin-design-vue`**

- `ArmPosition` perdeu `elbowAngle` e `wristAngle` e ganhou `forearmAngle`;
  ambos os campos sao `SideRelativeAngle`. `NEUTRAL_ARM_POSITION` acompanha.

Os escritores de metadado acompanham a convencao: `createTask` e a atualizacao de
status escreviam a linha sem a quebra forte, entao `taskin new` e `taskin start`
produziam arquivo que o proprio `lint --fix` considerava fora do padrao.

