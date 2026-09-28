# 🧩 Task 099 — Um PWA so do mascote: o Taskin em tela cheia no celular, olhando e pedindo silencio

- Status: done
- Type: feat
- Assignee: sidartaveloso
- Priority: 12651

## Description
Um pacote novo, aplicacao instalavel, com o Taskin ocupando a tela inteira do celular. O celular fica apoiado abaixo do monitor, virado para quem programa: o mascote acompanha os olhos e o rosto pela camera frontal e, quando alguem na sala fala alto, dispara o shhh com voz e chiado. E a story BrunoShhh sem os controles de laboratorio em volta, empacotada para viver o dia inteiro num aparelho. Precisa resolver o que a story nao resolve: tela que nao apaga, permissao de camera e microfone fora do localhost, audio depois do gesto do usuario, configuracao sem .taskin.json, e custo de bateria.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->
- [x] Pacote novo `@opentask/taskin-mascote` (Vite + Vue), publicado como aplicacao
- [x] Tela unica: o `Taskin` ocupando a viewport, sem os controles de laboratorio (`showControls: false`)
- [x] Tela de entrada com um botao — e o gesto que libera audio, camera, microfone e trava de tela
- [x] Gaveta de ajustes: nome a chamar, frase, som, volume, sensibilidade, insistencia
- [x] Persistir no `localStorage` no mesmo formato do bloco `mascot.reactions.noise`
- [x] Manter a tela acesa com a Screen Wake Lock API, reconquistando no `visibilitychange`
- [x] `manifest.webmanifest` e icones, `standalone` e `portrait`
- [x] Service worker (vite-plugin-pwa) para abrir sem rede depois da primeira visita
- [x] Publicar junto do site, no mesmo workflow do Pages, em `/taskin/mascote/`
- [x] Fechar a divergencia que o caso revelou: `sustainMs`, `sustainRatio` e `name` no `.taskin.json`
- [x] Documentar: `README.md` do pacote e `docs/ARCHITECTURE.md`
- [ ] Modo economico com rastreamento em cadencia reduzida — adiado: exige medir consumo num aparelho de verdade, que e o passo seguinte
- [ ] Testar instalado no iOS Safari e no Android Chrome — adiado: depende do aparelho; e a unica verificacao que o navegador do desenvolvimento nao substitui

## Notes

### O que foi entregue

Um pacote novo, `@opentask/taskin-mascote`, que e o `TaskinWithShhh` empacotado
para viver num aparelho. A aplicacao inteira e uma tela: portao de entrada,
mascote em tela cheia, e uma engrenagem discreta que abre a gaveta de ajustes.

O comportamento nao e novo — ele ja existia inteiro no organismo, e as tasks 092
a 098 o deixaram no ponto. O trabalho aqui foi de empacotamento e de aparelho.

### As tres decisoes que o navegador impos

**A tela apaga.** `criarTrancaDeTela` encapsula a Screen Wake Lock API com as
duas regras que ela tem: so e concedida apos interacao do usuario, e **e
liberada sozinha quando a aba deixa de estar visivel**. A segunda e a que pega
quem so pede a trava uma vez no inicio; por isso `useTrancaDeTela` reconquista
no `visibilitychange`. Quando nao da — bateria baixa, aparelho sem a API — o
motivo aparece na gaveta em vez de o mascote fingir que esta tudo bem.

**Camera, microfone e audio pedem gesto e contexto seguro.** Dai o portao com um
botao: nao e tela de carregamento, e o unico momento em que o navegador libera
as tres coisas. E dai tambem publicar junto do site: um celular acessando o
computador por IP da rede local nao e HTTPS nem `localhost`, entao nao serviria.

**Nao ha `.taskin.json` num celular.** O que vai para o `localStorage` e um
bloco `mascot` no formato do arquivo, validado pela mesma
`resolveMascotNoiseSettings`. Guardar o objeto ja resolvido seria mais simples e
criaria uma segunda definicao do que e uma reacao a ruido. Do jeito que ficou, o
que se ajusta no celular pode ser colado no arquivo de um projeto.

### A divergencia que o caso revelou

Ao ir gravar a configuracao, apareceu que `sustainMs`, `sustainRatio` e `name`
so existiam como prop do componente — o `.taskin.json` nao os carregava, e o
proprio codigo dizia isso num comentario e contornava lendo da prop mesmo quando
recebia o bloco. Sem fechar isso, o mascote no celular nao teria como guardar o
nome de quem chamar. Os tres entraram no schema e o contorno saiu.

### Evidencia

- `packages/mascote/src/composables/tranca-de-tela.spec.ts` — 6 testes: concede,
  nao pede duas vezes, pede de novo apos o navegador liberar, explica a recusa
  sem derrubar, avisa quando a API nao existe, e solta uma vez so.
- `packages/mascote/src/composables/ajustes.spec.ts` — 9 testes: defaults, JSON
  quebrado, valor fora da faixa, ausencia de armazenamento, recusa de bloco
  invalido antes de gravar, e ida-e-volta.
- `packages/mascote/src/App.spec.ts` — 6 testes, com a API de wake lock de
  verdade no jsdom: abre no portao, o toque e que pede a trava, o mascote vem
  sem controles, os ajustes gravados chegam como bloco, a gaveta fica fechada, e
  o que se muda nela sobrevive.
- `packages/design-vue/.../TaskinWithShhh.spec.ts` — dois testes novos:
  `showControls: false` e a sustentacao vinda do bloco.
- `packages/types-ts/src/taskin.schemas.test.ts` — 127 testes.
- Verificado no navegador em 375x812: portao, mascote em tela cheia sem
  controles, gaveta abrindo, e a trava reportando a recusa do ambiente.
- Suite completa verde: 44 tarefas do turbo.

### O que fica para o aparelho

Duas coisas nao dava para fazer aqui, e estao desmarcadas acima. O modo
economico precisa de medicao de consumo real. E o **risco que mais importa**:
o Safari do iOS ja teve historico de negar camera e microfone a aplicacoes
instaladas na tela inicial rodando em `standalone`. Isso precisa ser conferido
instalado no aparelho — se falhar, o caminho conhecido e abrir pela aba em vez
de instalar, e a task volta.
