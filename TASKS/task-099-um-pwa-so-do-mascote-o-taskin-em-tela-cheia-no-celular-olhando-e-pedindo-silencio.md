# 🧩 Task 099 — Um PWA so do mascote: o Taskin em tela cheia no celular, olhando e pedindo silencio

- Status: pending
- Type: feat
- Assignee: Sidarta Veloso

## Description
Um pacote novo, aplicacao instalavel, com o Taskin ocupando a tela inteira do celular. O celular fica apoiado abaixo do monitor, virado para quem programa: o mascote acompanha os olhos e o rosto pela camera frontal e, quando alguem na sala fala alto, dispara o shhh com voz e chiado. E a story BrunoShhh sem os controles de laboratorio em volta, empacotada para viver o dia inteiro num aparelho. Precisa resolver o que a story nao resolve: tela que nao apaga, permissao de camera e microfone fora do localhost, audio depois do gesto do usuario, configuracao sem .taskin.json, e custo de bateria.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [ ] Pacote novo `@opentask/taskin-mascote` (Vite + Vue), com build de aplicacao como o `build:app` do dashboard
- [ ] Tela unica: o `Taskin` ocupando a viewport inteira, sem os controles de laboratorio da story
- [ ] Tela de entrada com um botao — e o gesto que libera audio, camera e microfone de uma vez
- [ ] Gaveta de ajustes: nome a chamar, limiar, sustentacao, volume, ligar/desligar camera
- [ ] Persistir os ajustes no `localStorage`, com o mesmo formato do bloco `mascot.reactions.noise`
- [ ] Manter a tela acesa com a Screen Wake Lock API, e readquirir o lock quando a aba volta a ficar visivel
- [ ] `manifest.webmanifest` e icones para instalar na tela inicial; display `standalone`, orientacao `portrait`
- [ ] Service worker para abrir sem rede depois da primeira visita
- [ ] Modo economico: rastreamento facial em cadencia reduzida, e um modo so-microfone sem camera
- [ ] Publicar junto do site, no mesmo workflow do Pages, em um subcaminho proprio
- [ ] Testar no aparelho de verdade: iOS Safari e Android Chrome, instalado na tela inicial
- [ ] Documentar como apoiar o celular e o que cada ajuste faz

## Notes

### O que e

O Taskin em tela cheia num celular apoiado abaixo do monitor, virado para quem
programa. Ele acompanha os olhos e o rosto pela camera frontal e, quando alguem
na sala fala alto, dispara o shhh — chama a pessoa pelo nome, faz a pausa e
chia, como a task-098 deixou.

A story `BrunoShhh` ja mostra a funcionalidade. O que falta e tudo que uma story
nao precisa resolver: viver o dia inteiro num aparelho, com a tela acesa, fora
do `localhost`, sem `.taskin.json` para ler, e sem torrar a bateria.

### O que vem pronto

- `TaskinWithShhh` (`@opentask/taskin-design-vue`) — a reacao completa.
- `useFaceLandmarker` e `createNoiseWatcher` (`@opentask/ui-sense`).
- `createShhhVoice` — fala pelo `speechSynthesis` e chiado sintetizado.
- O esquema de configuracao em `@opentask/taskin-types`
  (`MascotConfigInput`, `resolveMascotNoiseSettings`).

O trabalho e de empacotamento e de aparelho, nao de mascote.

### O que a story nao resolve, e aqui precisa

**A tela apaga.** Um celular apagado nao olha para ninguem. A Screen Wake Lock
API (`navigator.wakeLock.request('screen')`) resolve, mas exige HTTPS, so
funciona apos interacao e **e liberada quando a aba fica oculta** — entao
precisa ser readquirida no `visibilitychange`. Sem isso o mascote morre no
primeiro alt-tab.

**Camera e microfone fora do localhost.** `getUserMedia` exige contexto seguro:
ou HTTPS, ou `localhost`. Um celular acessando o computador por IP da rede local
nao e nenhum dos dois. Publicar junto do site no GitHub Pages resolve de graca —
o aparelho abre uma URL e pronto. **Risco a verificar no aparelho**: o Safari do
iOS ja teve historico de negar camera e microfone a aplicacoes instaladas na
tela inicial rodando em `standalone`; e preciso testar instalado, e nao apenas
na aba.

**O audio so toca depois de um gesto.** Por isso a tela de entrada com um botao:
nao e enfeite, e o unico momento em que o navegador libera som, camera e
microfone. Um botao, e o resto do dia o mascote so trabalha.

**Nao ha `.taskin.json` num celular.** A configuracao vai para o
`localStorage`, mas **no mesmo formato** do bloco `mascot.reactions.noise` — a
mesma funcao `resolveMascotNoiseSettings` valida os dois, para nao nascer uma
segunda definicao do que e uma reacao a ruido.

**Bateria e calor.** Rodar o `FaceLandmarker` continuamente num celular custa
caro, e um aparelho quente reduz o proprio desempenho. Precisa de cadencia
reduzida para o rastreamento e de um modo so-microfone, em que o mascote nao
olha mas ainda pede silencio — que ja e metade do valor.

### Decisoes a tomar

- **Onde publicar.** Junto do site, no mesmo workflow do Pages, parece o
  caminho: da HTTPS de graca e o celular so precisa abrir um endereco. A
  alternativa e o `taskin dashboard` servir a pagina, mas ai volta o problema do
  contexto seguro na rede local.
- **Se le tarefas.** A versao minima nao precisa: e um mascote, nao um painel.
  Mas ele ja sabe reagir a estado de tarefa, e o celular esta ali parado. Fica
  para depois, e de proposito.
- **Relacao com a task-097.** A escada de humores — o mascote se irritando por
  etapas quando o barulho insiste — e o comportamento que mais aparece num
  aparelho ligado o dia inteiro. As duas se reforcam, mas nenhuma bloqueia a
  outra.

### Como saber que ficou pronto

Com o celular apoiado abaixo do monitor, tela acesa sozinha por uma hora: o
mascote acompanha quem esta na frente, e uma conversa alta na sala faz ele
chamar a pessoa pelo nome e chiar, sem ninguem tocar no aparelho.
