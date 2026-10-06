---
'@opentask/taskin-design-vue': minor
---

O mascote vira motor e personagem. O `Taskin` cuida do comportamento — humores, piscar, olhar seguindo o cursor, fala, ações e efeitos — e quem ele é vem da prop `character`, uma personagem feita com `defineCharacter`: cores, geometria dos olhos, da boca e dos braços, sombra, movimentos por humor, tabela de ações, pose de escuta, âncoras dos balões e das mãos, e as partes desenhadas (`body`, e opcionalmente `back` e `front`), que recebem `CharacterPartProps`. Sem `character`, nada muda: é o polvo Taskin (`TASKIN_CHARACTER`).

Entram `SKELETON_CHARACTER`, o motor sem bicho com as marcações das partes, de onde uma personagem nova começa, e `CharacterAnchors`, que desenha as âncoras de qualquer personagem por cima do desenho dela. As poses comuns (`WAVE`, `START`, `EFFORT`, `WAKE`, `POINT_UP`, `POINT_DOWN`, `celebratePose`, `pointPose`) e `eyeShift` saem do pacote para personagens de fora reaproveitarem. `TaskinSays`, `TaskinWithShhh` e `TaskinWithFaceTracking` repassam a `character`; `actionDuration` e `scriptDuration` recebem a personagem. As peças atômicas recebem o dado que usam: `TaskinEyes` a `geometry`, `TaskinMouth` o `offset` e a `ink`, `TaskinArms` a `geometry`.
