# 🧩 Task 182 — O shhh no pulso: chama o nome, fala a frase e vibra

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6700
- Difficulty: 2

## Description
Quando o detector dispara, o mascote faz o shhh: humor e boca, voz pelo TextToSpeech dizendo o nome e a frase, e vibracao quando o som estiver desligado, seguindo o plano de resolveShhhReactionPlan portado para Kotlin com os casos compartilhados.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `core`: `resolveShhhReactionPlan` em Kotlin contra `packages/types-ts/src/__fixtures__/shhh-reaction-plan.cases.json` — vermelho antes
- [ ] Teste primeiro, em `core`: a fala montada a partir do nome e da frase igual a do navegador (tabela nova `shhh-voice.cases.json` ao lado de `shhh-voice.ts`, com o teste TypeScript correspondente)
- [ ] Em `app`: ao disparo do detector, o mascote vai para o humor shhh pelo tempo do plano e volta; voz pelo `TextToSpeech` (pt-BR, com a recusa de idioma tratada) dizendo nome e frase; com som desligado, vibracao pelo `Vibrator`/`VibrationEffect` no padrao escolhido
- [ ] Teste de UI/unidade com TTS e vibrador falsos: com som, fala e nao vibra; sem som, vibra e nao fala; o humor volta ao fim do plano
- [ ] Etapas de irritacao e calmaria ficam fora: a task-097 ainda esta `pending` no TypeScript. Quando ela fechar, o porte entra numa task nova, pelo mesmo caminho da tabela compartilhada
- [ ] Evidencia: video do emulador disparando o shhh, em `TASKS/assets/task-182/`

## Notes
Depende das tasks 176, 177, 179 e 181.

### Contexto da rodada
- Ler: `packages/types-ts/src/taskin.schemas.ts` (so `resolveShhhReactionPlan` e `ShhhReactionPlan`); `packages/ui-sense/src/utils/shhh-voice.ts` (so a montagem da frase e o que e falado; o chiado sintetizado nao entra no relogio).
- Nao ler: `TaskinWithShhh.vue` inteiro — se precisar do fluxo, so o trecho de `resolveShhhReactionPlan` em diante.

### Verificacao
```bash
pnpm --filter @opentask/taskin-ui-sense test
pnpm --filter @opentask/taskin-mascote-wear test
pnpm --filter @opentask/taskin-mascote-wear lint
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
