# 🧩 Task 181 — O microfone do relogio alimenta o detector de ruido

- Status: pending
- Type: feat
- Assignee: sidartaveloso
- Group: taskin-no-pulso
- Priority: 6600
- Difficulty: 3

## Description
Ler o microfone com AudioRecord, calcular o RMS do mesmo jeito que o navegador e alimentar o detector em Kotlin. A permissao RECORD_AUDIO e pedida no primeiro uso e a recusa aparece explicada na tela.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Teste primeiro, em `core`: `rms(amostras: ShortArray|FloatArray)` igual ao do navegador — tabela `packages/ui-sense/src/utils/__fixtures__/rms.cases.json` (criada aqui, com o teste TypeScript correspondente em `ui-sense`) com buffers e o RMS esperado
- [ ] Em `app`: leitor de microfone com `AudioRecord` (16 kHz, mono, PCM 16) num coroutine, entregando `rms` ao `NoiseDispatcher` da task-177 em cadencia proxima a do navegador (anotar qual)
- [ ] Permissao `RECORD_AUDIO` declarada e pedida no primeiro uso; recusada, a tela diz por que o mascote nao reage e como liberar — nada de mascote mudo sem motivo. Teste de UI dos dois caminhos
- [ ] Liberar o `AudioRecord` ao sair de `STARTED`; teste com fonte de audio falsa
- [ ] Conferir no emulador `taskin_wear` com o microfone do host: falar alto faz o detector disparar (log ou indicador de nivel), evidencia em `TASKS/assets/task-181/`

## Notes
Depende das tasks 175 e 177.

### Contexto da rodada
- Ler: `packages/ui-sense/src/utils/noise-watcher.ts` — so `createNoiseWatcher` (como o navegador calcula o RMS e a cadencia de amostragem); o `NoiseDispatcher` Kotlin da task-177.
- Nao ler: `design-vue`, `types-ts`.

### Verificacao
```bash
pnpm --filter @opentask/taskin-ui-sense test
pnpm --filter @opentask/taskin-mascote-wear test
pnpm --filter @opentask/taskin-mascote-wear lint
```

### Onde executar
`sidarta-desktop` (Tailscale): e a maquina com JDK 21 (asdf, Temurin), Android SDK em `~/Android/Sdk` (plataforma 36, build-tools 36, emulador e a imagem Wear OS 36 no AVD `taskin_wear`, redondo 454x454) e Docker nativo. O Mac nao tem Android SDK. Abrir um shell interativo (o `.bashrc` so exporta `ANDROID_HOME` e o PATH do SDK em shell interativo).

Fechar a task so com o checklist marcado e, ao lado de cada item, o que o comprova (nome do teste, comando, arquivo).
