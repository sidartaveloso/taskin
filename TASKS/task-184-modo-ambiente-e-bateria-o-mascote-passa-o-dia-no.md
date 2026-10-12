# 🧩 Task 184 — Modo ambiente e bateria: o mascote passa o dia no pulso

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6900
- Difficulty: 3

## Description
No always-on o mascote vira um desenho simplificado e o acelerometro para; a escuta continua em cadencia reduzida, ou para, conforme o ajuste. Medir o consumo por hora no aparelho e registrar.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `core`: a politica de energia como funcao pura — dado (tela ativa/ambiente/apagada, ajuste de escuta) diz se o acelerometro roda, se o microfone roda e em que cadencia
- [ ] Em `app`: `AmbientLifecycleObserver` liga o modo ambiente; o mascote vira contorno simplificado, sem cores cheias e sem animacao, com deslocamento periodico contra burn-in
- [ ] O acelerometro para no ambiente; a escuta segue a politica (padrao: reduzida no ambiente, parada com a tela apagada) e o ajuste aparece na tela da task-183
- [ ] Teste de UI do modo ambiente (captura) e teste da politica aplicada (sensores falsos registrados/desregistrados)
- [ ] Medir no Galaxy Watch6 de verdade: `adb shell dumpsys batterystats` antes e depois de 1 h com o app aberto, nas duas politicas; registrar a tabela nas notas
- [ ] Evidencia: captura do modo ambiente em `TASKS/assets/task-184/`

## Notes
Depende das tasks 179, 180 e 181. A medicao precisa do relogio fisico: e a parte que a task-099 deixou adiada por falta de aparelho.

O relogio conecta ao `sidarta-desktop` por depuracao sem fio passando por tunel SSH reverso a partir do notebook, que e quem esta na mesma rede do relogio: `ssh -N -R 37000:<ip-relogio>:<porta-pareamento> -R 37001:<ip-relogio>:<porta-conexao> sidarta-desktop`, e no desktop `adb pair localhost:37000 <codigo>` e `adb connect localhost:37001`.

### Contexto da rodada
- Ler: os adaptadores das tasks 180 e 181 em `packages/mascote-wear/app`.

### Verificacao
```bash
pnpm --filter @opentask/taskin-mascote-wear test
pnpm --filter @opentask/taskin-mascote-wear lint
pnpm --filter @opentask/taskin-mascote-wear build
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo). A medicao e manual, com o relogio; nao e task para o sandcastle.

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
