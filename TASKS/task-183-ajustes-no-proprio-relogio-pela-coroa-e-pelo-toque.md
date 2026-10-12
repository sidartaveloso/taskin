# 🧩 Task 183 — Ajustes no proprio relogio, pela coroa e pelo toque

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6800
- Difficulty: 3

## Description
Uma tela de ajustes no relogio para nome, frase, som, sensibilidade e sustentacao, operada pela coroa (rotary input) e pelo toque, gravando no DataStore no formato do bloco mascot.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `app`: tela de ajustes abre por um toque longo no mascote (ou botao na borda), mostra nome, frase, som, sensibilidade (limiar) e sustentacao; mudar um valor grava no repositorio da task-178 e sobrevive a reabrir o app
- [ ] Lista com `TransformingLazyColumn`/`ScalingLazyColumn` e `rotaryScrollable`: a coroa rola a lista e ajusta o valor do item focado; teste com evento rotativo simulado
- [ ] Nome e frase pelo teclado/ditado do relogio (`RemoteInput`)
- [ ] Botao para mostrar o bloco `mascot` como texto (a exportacao da task-178), para copiar para um `.taskin.json`
- [ ] Evidencia: capturas Roborazzi da tela de ajustes em 454 px, em `TASKS/assets/task-183/`

## Notes
Depende das tasks 175, 178 e 179. Equivale a gaveta de ajustes da task-099, no formato de relogio.

### Contexto da rodada
- Ler: `packages/mascote/src/components/GavetaDeAjustes.vue` (quais ajustes existem e as faixas); o repositorio de ajustes da task-178.
- Nao ler: `design-vue`.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear test
pnpm --filter @opentask/taskin-mascote-wear lint
pnpm --filter @opentask/taskin-mascote-wear build
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
