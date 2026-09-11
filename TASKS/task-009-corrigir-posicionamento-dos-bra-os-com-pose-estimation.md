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
