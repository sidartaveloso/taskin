# 🧩 Task 179 — O Taskin desenhado em Compose na tela redonda, com os mesmos tracos do SVG

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6400
- Difficulty: 4

## Description
Desenhar o mascote em Compose Canvas reaproveitando os paths do SVG do design-vue, sem redesenhar a mao, com os humores que o shhh usa, cabendo inteiro em telas redondas de 432 a 480 px, e com teste de captura de tela como evidencia.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] **O mascote e o novo**, o `Taskin` de `organisms/taskin/Taskin.ts`, montado pelos atomos — e nao o `TaskinV1` (`TaskinV1.ts`, que desenha o `taskin.svg` inteiro e esta em `Organisms/Taskin/V1` no Storybook). Nada do `taskin.svg` entra no relogio
- [ ] Gerar, a partir dos componentes do design-vue, um arquivo Kotlin com os paths do mascote (strings `d` do SVG, `viewBox` 320x260, cores) por um script do repositorio, e nao copiando a mao. O teste do script confere que todo path dos atomos `taskin-body`, `taskin-eyes`, `taskin-mouth`, `taskin-arms`, `taskin-tentacle` usados nos humores do shhh esta no arquivo gerado
- [ ] Teste primeiro, em `app`: teste de captura de tela (Roborazzi 1.76 sobre Robolectric 4.17) do mascote nos humores neutro e shhh, em telas redondas de 432, 454 e 480 px — vermelho antes do desenho
- [ ] `TaskinCanvas` em Compose: desenha os paths com `PathParser().parsePathString(d).toPath()`, escala o `viewBox` para caber inteiro no circulo inscrito da tela (nada cortado nos cantos), rosto centrado
- [ ] Os humores que o shhh usa: neutro, atento e shhh (boca e dedo/tentaculo). Os demais humores ficam fora — anotar quais
- [ ] Pupilas como estado separado (deslocamento x, y normalizado em -1..1), sem sensor ainda: e a costura que a task-180 usa
- [ ] Trocar o icone do launcher: o provisorio da task-175 veio de `packages/mascote/public/icone-512.png`, que e gerado do `taskin.svg` (o V1). O novo sai do proprio desenho em Compose (captura do Roborazzi, recortada para o circulo), nas cinco densidades de `mipmap-*`
- [ ] Evidencia visual: as capturas do Roborazzi copiadas para `TASKS/assets/task-179/` e, ao lado, a captura do mesmo humor no Storybook do design-vue para comparar; referenciadas aqui

## Notes
Depende da task-175. O desenho e o ponto onde a versao nativa mais corre risco de virar "outro mascote": por isso os tracos vem do SVG por geracao, e a comparacao lado a lado com o Storybook e a evidencia exigida.

O Galaxy Watch6 tem tela redonda de 432 px (40 mm) e 480 px (44 mm); o emulador `taskin_wear` e 454 px.

### Contexto da rodada
- Ler: `packages/design-vue/src/components/organisms/taskin/Taskin.ts` (so o trecho do `viewBox` e a montagem dos atomos, por volta da linha 1345, e `TASKIN_MOODS` em `Taskin.moods.ts`); os `.vue` dos atomos citados, so os `<path>`/`<ellipse>`/`<circle>` e as cores.
- Nao ler: `TaskinV1.ts`, `taskin.svg`, stories, specs do design-vue, actions/controller do Taskin.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear wear:test
pnpm --filter @opentask/taskin-mascote-wear wear:lint
pnpm --filter @opentask/taskin-mascote-wear wear:build
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
