---
'@opentask/ui-sense': minor
'@opentask/taskin-design-vue': minor
---

O pedido de silêncio agora mede quanto da janela foi barulhento

`onNoiseAbove` passa a aceitar `{ sustainMs, sustainRatio, debounceMs }`. A
reação dispara quando, dentro dos últimos `sustainMs` milissegundos, pelo menos
a fração `sustainRatio` das amostras esteve acima do limiar. Antes bastava uma
única amostra alta — uma porta batendo pedia silêncio igual a um minuto de
conversa alta.

A medida é por fração, e não por sequência ininterrupta, porque uma fala não é
um platô: entre sílabas e frases há vales de 100 a 400ms, e exigir barulho
contínuo nunca dispararia numa conversa. Numa janela de 3s uma porta batendo
ocupa 1 a 4% e uma conversa alta ocupa 60 a 87%, e o padrão de 0.6 cai no vão
entre os dois. `sustainRatio: 1` restaura a exigência ininterrupta.

O amostrador passou de 100ms para 40ms entre leituras: cada leitura cobre
`fftSize / sampleRate` de áudio (~43ms a 48kHz), então o intervalo antigo
observava menos da metade da linha do tempo, inventando vales e deixando
estalos curtos passarem inteiros entre duas leituras.

`NoiseTrackingControls` ganhou o campo `Ratio` e um botão **Test Shhh**, que
toca a reação como se tivesse detectado — com o microfone desligado, ignorando
limiar e tempos — para ajustar frase, voz e volume sem gritar na sala.
`TaskinWithShhh` ganhou as props `noiseSustainMs` e `noiseSustainRatio`.

O padrão continua sendo `sustainMs: 0`, e o terceiro argumento numérico continua
significando `debounceMs`: nada do que já existia muda de comportamento.
