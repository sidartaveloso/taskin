# 🧩 Task 212 — Prototipo: o ui-sense distingue voz de ruido e reconhece quem esta falando

- Status: pending
- Type: feat
- Assignee: sidartaveloso

## Description
Hoje o ui-sense so mede volume (RMS no noise-watcher): um secador de cabelo e uma conversa no mesmo volume sao iguais para ele, e o shhh chama um nome fixo, nao quem esta falando. Prototipo para responder se da para, no navegador e sem mandar audio para fora do aparelho: (1) detectar voz (VAD) em vez de so volume; (2) reconhecer, entre 2 ou 3 pessoas cadastradas, quem esta falando, comparando a voz com amostras gravadas antes. A referencia e o renfild (github.com/t0mer/renfild), assistente de voz para Raspberry Pi que encadeia wake word, Silero VAD e reconhecimento de quem fala por ECAPA-TDNN; daqui se tira a sequencia de etapas, nao o projeto como dependencia. O resultado e uma story com o microfone e uma conclusao: vira task de verdade, muda de rumo ou e descartado.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Escolher o detector de voz entre o Silero VAD no navegador (`@ricky0123/vad-web`, ONNX) e o `AudioClassifier` do `@mediapipe/tasks-audio` (YAMNet, mesma familia do que o ui-sense ja usa): tamanho do modelo, latencia por janela, se roda sem rede. Anotar a escolha e o porque em Notes
- [ ] Composable de prototipo no ui-sense que, a partir do mesmo stream de `requestMediaStream` (`utils/camera.ts`), emite a probabilidade de fala por janela, com `*.mock.ts` como os outros composables
- [ ] Story com o microfone: indicador ao vivo de voz/nao voz ao lado do nivel RMS do `noise-watcher`, para comparar os dois. Falar baixo marca voz; ventilador, palmas e musica nao marcam
- [ ] Investigar um modelo de identificacao de voz que rode no navegador (ECAPA-TDNN ou WeSpeaker exportado para ONNX, via `onnxruntime-web`): existe export pronto, quanto pesa, quanto leva por trecho. Sem caminho viavel, marcar os itens seguintes como adiados com a razao e ir para a conclusao
- [ ] Na story: cadastro de 2 ou 3 vozes (amostra de ~10 s cada, guardada so no aparelho, com botao de apagar) e, a cada trecho que o VAD marcou como fala, o palpite de quem fala por similaridade de cosseno, com a pontuacao e um limiar abaixo do qual o palpite e "desconhecido"
- [ ] Medir com gente de verdade, no microfone do notebook: acertos com uma pessoa por vez, com duas falando juntas e com ruido de fundo. Anotar os numeros em Notes
- [ ] Evidencia visual: captura da story (voz vs. ruido e o palpite de quem fala) em `TASKS/assets/task-212/`, referenciada ao lado do item que comprova
- [ ] Conclusao em Notes: vira task de verdade (o shhh chama o nome de quem esta falando alto), muda de rumo ou e descartado — e por que

## Notes

### Referencia: renfild
- Repositorio: https://github.com/t0mer/renfild (Apache-2.0). Assistente de voz para Raspberry Pi que sabe quem esta falando: servidor em Go, processos auxiliares em Python, tudo local.
- O que olhar: a sequencia de uma fala, descrita na secao Architecture do README.
  - O `satellite` guarda os ultimos 2 s do microfone num buffer circular. A wake word (openWakeWord) dispara e esse trecho vira `wake.wav`.
  - O Silero VAD grava o comando ate 700 ms de silencio.
  - O `embedder` (ECAPA-TDNN) gera a assinatura da voz de `wake.wav` e compara por cosseno com cada pessoa cadastrada.
  - Cada intencao tem um papel minimo de quem pode pedi-la.
- O que nao usar: o projeto como dependencia. Ele exige um Pi com PyTorch (~1,5 GB), Whisper e Ollama, e o ui-sense roda inteiro no navegador. Daqui se tira a ideia, nao o codigo.

### Fora desta task
Transcrever o que foi dito (Whisper via transformers.js e pesado; a Web Speech API do Chrome manda o audio para o Google), wake word, ligar o palpite ao shhh e qualquer coisa no relogio (Wear OS).

### Privacidade
A amostra de voz cadastrada e dado biometrico, sensivel pela LGPD. O cadastro e consentido, a amostra fica so no aparelho e pode ser apagada, e reconhecer quem nao se cadastrou nao e objetivo.

### Contexto da rodada
- Ler: `packages/ui-sense/src/utils/noise-watcher.ts` (so `createNoiseWatcher` e o comentario de `sustainRatio`), `packages/ui-sense/src/utils/camera.ts` (`requestMediaStream`, `DEFAULT_AUDIO_CONSTRAINTS`), `packages/ui-sense/src/components/molecules/noise-tracking-controls/` (como a story atual usa o microfone), um composable existente com mock como molde (`composables/use-face-landmarker/`).
- Nao ler: `design-vue`, `mascote-wear`, `types-ts`.

### Verificacao
```bash
pnpm --filter @opentask/ui-sense typecheck
pnpm --filter @opentask/ui-sense lint
pnpm --filter @opentask/ui-sense test
```

### Onde executar
Numa maquina com microfone e navegador, de forma interativa. O prototipo precisa de microfone, de gente falando e de alguem olhando a story, entao nao serve para o sandcastle.
