# 🧩 Task 180 — Os olhos seguem a inclinacao do pulso pelo acelerometro

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6500
- Difficulty: 3

## Description
Sem camera no relogio, as pupilas rolam para o lado mais baixo conforme a inclinacao lida pelo acelerometro, com suavizacao e zona morta. A conta e uma funcao pura testada antes; o sensor e lido em cadencia baixa e para quando a tela apaga.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `core`: `olharPelaGravidade(gx, gy, gz, anterior, config) -> Olhar` — pulso parado e plano da centro; inclinar para a direita leva as pupilas para a direita na proporcao da inclinacao; abaixo da zona morta nao mexe; a suavizacao (filtro passa-baixa) nao deixa um pico isolado chegar inteiro; saida sempre limitada a -1..1
- [ ] A funcao em Kotlin puro, com `config` (zona morta, fator de suavizacao, ganho) e defaults escolhidos e anotados
- [ ] Em `app`: adaptador do `SensorManager` (`TYPE_GRAVITY`, com `TYPE_ACCELEROMETER` como alternativa) em `SENSOR_DELAY_UI` ou mais lento, registrado so com a tela ligada e a Activity em `STARTED` (lifecycle), alimentando o estado das pupilas da task-179
- [ ] Teste do adaptador com sensor falso: registra ao iniciar, desregistra ao parar
- [ ] Evidencia: video curto ou sequencia de capturas no emulador com o sensor virtual inclinado, em `TASKS/assets/task-180/`

## Notes
Depende das tasks 175 e 179. Ideia do usuario: sem camera no relogio, o olhar vem da inclinacao do pulso — as pupilas rolam para o lado mais baixo, como bolinhas.

### Contexto da rodada
- Ler: o estado das pupilas criado na task-179 em `packages/mascote-wear/app`; `packages/design-vue/src/components/atoms/taskin-eyes/TaskinEyes.types.ts` (so `trackingBounds`, para usar a mesma amplitude).
- Nao ler: o rastreamento de rosto do design-vue.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear wear:test
pnpm --filter @opentask/taskin-mascote-wear wear:lint
pnpm --filter @opentask/taskin-mascote-wear wear:build
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo). A funcao pura roda em qualquer maquina com JDK 21.

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
