---
'@opentask/ui-sense': patch
---

Faz `getArmAngles` devolver `null` quando falta landmark, e enxuga o espelhamento
da pose.

`getArmAngles` lia seis landmarks do resultado do MediaPipe e calculava direto,
sem a guarda que `getHeadTilt` e `getTorsoTilt` já faziam. A função sempre
declarou `ArmAngles | null` e nunca usava o `null`: com uma pose parcial, os
ângulos saíam como `NaN` e desciam para quem consome. Agora ela devolve `null`,
que é o caso que a assinatura sempre prometeu.

O espelhamento (`mirrorPose`) era feito por 16 destructuring swaps escritos à
mão, um par LEFT/RIGHT por vez. Virou a tabela `MIRRORED_PAIRS` mais
`swapMirroredPairs` — 90 linhas a menos e a lista conferível de relance; antes,
um par faltando ou repetido no meio de noventa linhas simétricas passava batido.
O swap também ignora índice ausente em vez de escrever `undefined` dentro do
array: o MediaPipe sempre devolve os 33 pontos, mas o destructuring abria buracos
silenciosos se algum dia devolvesse menos.

Sem mudança de API.
