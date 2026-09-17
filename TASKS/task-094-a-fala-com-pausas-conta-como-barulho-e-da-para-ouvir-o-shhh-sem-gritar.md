# 🧩 Task 094 — a fala com pausas conta como barulho, e da para ouvir o shhh sem gritar

- Status: in-progress
- Type: feat
- Assignee: Sidarta Veloso

## Description
A sustentacao continua da task-093 nao detecta gente conversando: entre silabas e frases ha vales de 100 a 400ms, e cada vale zera a contagem. Trocar o criterio por fracao de uma janela deslizante (sustainRatio), corrigir o buraco de amostragem (leitura cobre 43ms a cada 100ms, menos da metade da linha do tempo) e dar um botao nos controles que dispara a reacao como se tivesse detectado, para ajustar frase, voz e volume sem gritar na sala.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### Critério: fração da janela, não contagem contínua
- [ ] Testes antes do código, com relógio falso e sequências sintéticas: fala com vales de 100–400ms dispara; porta batendo (1–3 amostras altas) não dispara; a janela precisa estar cheia antes de qualquer disparo; `sustainRatio: 1` reproduz a sustentação contínua; `sustainMs: 0` mantém o disparo na primeira amostra alta
- [ ] `sustainRatio` (default 0.6) em `NoiseThresholdOptions`, e `sustainMs` passa a significar a janela deslizante em que se mede
- [ ] Amostras recentes por listener, descartando o que saiu da janela

### Amostragem sem buraco
- [ ] `pollingInterval` de 100ms para 40ms: cada leitura cobre `fftSize/sampleRate` ≈ 43ms (2048 a 48kHz) ou 46ms (a 44.1kHz), então 100ms observa menos da metade da linha do tempo e inventa vales que não existem na sala
- [ ] Comentário registrando a conta, para o número não voltar a 100 sem querer

### Gatilho manual
- [ ] Teste: o botão emite `trigger-shhh`
- [ ] Botão nos `NoiseTrackingControls` que dispara a reação como se tivesse detectado — funciona com o microfone desligado, ignora limiar, sustentação e debounce
- [ ] `TaskinWithShhh` liga o evento ao `triggerShhhReaction()`, com som e fala iguais aos de uma detecção real

### Storybook, documentação e fechamento
- [ ] `argType`/`arg` de `noiseSustainRatio` e a `BrunoShhh` com os valores do caso real
- [ ] `MASCOT_NOISE_REACTION.md`: o critério descrito lá é o contínuo
- [ ] Changeset
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Por que a sustentação contínua não serve
Uma fala não é um platô. Entre sílabas e frases há vales de 100 a 400ms, então
uma conversa alta chega ao amostrador como `alto, alto, baixo, alto, alto,
alto, baixo…`. Com contagem contínua, cada vale zera o acúmulo e uma
sustentação de dois segundos praticamente nunca fecha. O critério da task-093
detecta bem um secador de cabelo e não detecta gente conversando, que é o caso
para o qual a reação existe.

### O que a fração separa
Numa janela de 3s a 40ms por amostra (75 amostras):

| evento | amostras altas | fração |
| --- | --- | --- |
| porta batendo | 1 a 3 | 1–4%, não dispara |
| tosse | 2 a 6 | 3–8%, não dispara |
| conversa alta | 45 a 65 | 60–87%, dispara |

`sustainRatio: 1` continua disponível para quem quiser o comportamento contínuo.

### A janela precisa estar cheia
Sem isso, a primeira amostra alta dá fração 1/1 e dispara na hora, que é
exatamente o que o critério quer evitar. Só se avalia quando as amostras
guardadas cobrem a janela inteira.

### O buraco de amostragem
`analyser.fftSize` é 2048, então cada leitura cobre ~43ms de áudio a 48kHz,
enquanto o `pollingInterval` é 100ms: observa-se 43 de cada 100ms. Vales que não
existem aparecem na medição e um estalo curto pode passar inteiro entre duas
leituras. Com 40ms a cobertura fecha nas duas taxas comuns (48kHz e 44.1kHz).

### O gatilho manual não é atalho de teste
Ajustar frase, voz e volume junto com o detector não diz qual dos dois está
errado. O botão dispara a reação sem passar pelo detector — microfone
desligado, limiar e tempos ignorados — e é o que permite calibrar o estilo sem
gritar na sala.
