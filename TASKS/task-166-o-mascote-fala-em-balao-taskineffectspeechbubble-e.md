# 🧩 Task 166 — O mascote fala em balao: TaskinEffectSpeechBubble e a prop speechText

- Status: in-progress
- Type: feat
- Assignee: sidartaveloso
- Group: movimentos-do-mascote
- Priority: 14310
- Difficulty: 3

## Description
O mascote so tem balao de pensamento; quem quer que ele fale com a pessoa (o chat, o app do mascote, a landing) precisa desenhar o balao por fora, e o texto fica descolado do desenho. Um balao de fala nativo, com rabicho saindo da boca, dimensionado pela frase como o de pensamento, ligado pela prop speechText do Taskin, no Taskin e no Sapin.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Molecula `TaskinEffectSpeechBubble` em `packages/design-vue/src/components/molecules/taskin-effect-speech-bubble/`: retangulo arredondado com rabicho apontando para a boca (`MOUTH_OFFSET` de cada variante), texto quebrado em `<tspan>` pelo mesmo `layoutThoughtBubble` do balao de pensamento (reaproveitado, sem copia), sem a pulsacao; com `animationsEnabled`, uma entrada curta (pop) e so
- [ ] Prop `speechText?: string` no `Taskin` e em `TaskinProps`: com texto, o balao de fala aparece e o de pensamento sai de cena (falar ganha de pensar); vazio ou `undefined`, nada muda. Funciona nas duas variantes
- [ ] Stories: `Molecules/Taskin/Effects/SpeechBubble` (curta, longa, Sapin, sem animacao) e `Organisms/Taskin/Taskin` ganha a story `Speaking`, com `speechText` e `speaking` ligados
- [ ] Testes: a molecula desenha o texto e o rabicho; o `Taskin` mostra o balao so com `speechText`, e esconde o de pensamento quando os dois vem; `pnpm --filter @opentask/taskin-design-vue test` verde
- [ ] Evidencia visual em `TASKS/assets/task-166/`: taskin e sapin falando, frase curta e longa, referenciadas aqui
- [ ] Changeset minor no `@opentask/taskin-design-vue`

## Notes
Nasce do experimento de 03/10/2026: o Claude passou a conversar pelo Taskin dentro do chat (componente Vue montado via esm.sh a partir do npm), e o balao de fala teve de ser HTML por fora, porque o mascote so sabe pensar. Esta task traz o balao para dentro do desenho. Irma da task-167 (o roteiro).

### Contexto
- `packages/design-vue/src/components/molecules/taskin-effect-thought-bubble/` (molecula, `thought-bubble-layout.ts`, story e spec): o modelo
- `packages/design-vue/src/components/organisms/taskin/Taskin.ts`: props `showThoughtBubble`/`thoughtBubbleText`, o `config` computado e a lista de efeitos no `render`
- `packages/design-vue/src/components/atoms/taskin-mouth/TaskinMouth.types.ts`: `MOUTH_OFFSET`, onde a boca esta em cada variante

### Verificacao
```bash
pnpm --filter @opentask/taskin-design-vue typecheck
pnpm --filter @opentask/taskin-design-vue lint
pnpm --filter @opentask/taskin-design-vue test
```
