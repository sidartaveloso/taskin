# 🧩 Task 095 — o debug mostra o quanto falta para o shhh disparar

- Status: done
- Type: feat
- Assignee: Sidarta Veloso

## Description
No criterio de fracao da janela nao existe um relogio regressivo simples: o disparo depende do que vier a seguir. O debug passa a mostrar o estado real do criterio — quanto falta para a janela ficar coberta, a ocupacao atual contra a exigida, quanto falta do debounce, e uma previsao de quanto falta para disparar SE o barulho continuar no ritmo atual.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### Estado do critério no núcleo (`@opentask/ui-sense`)
- [x] Testes antes do código: a ocupação relatada bate com a fração de amostras altas; `msUntilWindowFull` cai até zero conforme a janela enche; o debounce aparece como tempo restante; a previsão de disparo bate com o disparo real quando o barulho continua
- [x] `NoiseProgress` e a opção `onProgress` em `onNoiseAbove`, chamada a cada amostra depois da decisão de disparar
- [x] Previsão simulando amostras altas futuras até a fração cruzar a exigida, com passo estimado das próprias amostras

### Debug do componente
- [x] `TaskinWithShhh` assina o `onProgress` e leva os números ao `debugInfo`, em texto legível no painel `Shhh Detection`
- [x] Story `BrunoShhh` com o debug ligado mostrando o estado

### Fechamento
- [x] `MASCOT_NOISE_REACTION.md` e changeset
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

### Evidência do que foi feito
- **Núcleo**: `packages/ui-sense/src/utils/noise-watcher.ts` — tipo
  `NoiseProgress`, opção `onProgress` e `preverDisparoPorOcupacao`, que simula o
  deslizar da janela com amostras altas até a ocupação cruzar a exigida. Cinco
  testes novos em `noise-watcher.spec.ts` (`describe('createNoiseDispatcher:
  progresso para o debug')`), escritos antes do código e vermelhos na primeira
  execução; o arquivo fecha em 28 testes.
- **A previsão é testada contra a realidade**: o teste `preve o disparo, e a
  previsao bate com o que acontece` captura o número previsto, segue alimentando
  barulho e exige que o disparo ocorra exatamente no instante previsto.
- **Componente**: `TaskinWithShhh.vue` — `noiseProgress`, o computed
  `noiseCountdown` e os quatro campos no painel `Shhh Detection`
  (`occupancy`, `windowFull`, `debounce`, `firesIn`). O estado é zerado ao
  cancelar a inscrição, para o painel não mostrar número parado como se fosse
  atual.
- **Verificação**: `pnpm lint`, `pnpm format`, `pnpm typecheck` (27/27) e
  `pnpm test` (42/42) verdes.

### Um defeito encontrado no caminho
O barril `packages/ui-sense/src/composables/index.ts` listava à mão três
símbolos do noise watcher e já estava defasado: `NoiseThresholdOptions`,
`NoiseThresholdTiming`, `DEFAULT_NOISE_SUSTAIN_MS` e `DEFAULT_NOISE_SUSTAIN_RATIO`
existiam no módulo e não chegavam a quem instala o pacote — foi assim que o
`NoiseProgress` apareceu como "has no exported member" no typecheck. Trocado por
`export * from '../utils/noise-watcher'`, que não diverge de novo.

### Duas expectativas minhas que estavam erradas
O teste da ocupação supunha "1 em cada 4 amostras dá 25%", ignorando que a
janela guarda 11 amostras e a borda não cai num múltiplo do padrão; passou a
alimentar exatamente a janela e a exigir 3/11. O teste do debounce esperava
zero no instante em que ele expira, mas nesse instante a amostra alta dispara e
reinicia a contagem — passou a verificar o zero com uma amostra baixa, e o
reinício com uma alta.

### Por que não é um relógio regressivo simples
No critério de fração da janela o disparo depende do que ainda vai acontecer:
se a pessoa fizer uma pausa longa, o tempo que falta aumenta. Um relógio que só
contasse desde o início do barulho mentiria — foi o pedido original, e a
resposta honesta é mostrar o estado do critério, não um número que finge
determinismo.

### O que o debug mostra
- **Enquanto a janela enche**: quanto falta para ela ficar coberta. Esse sim é um
  tempo determinístico, porque não depende do nível.
- **Depois**: a ocupação atual contra a exigida (`72% / 60%`), que é o critério
  em si.
- **Depois de disparar**: quanto falta do debounce.
- **A previsão**: quanto falta para disparar *se o barulho continuar no ritmo
  atual*. É calculável simulando amostras altas até a fração cruzar a exigida, e
  termina sempre, porque uma janela inteira de barulho dá ocupação 1.

A previsão é testada contra a realidade: o teste captura o número previsto, segue
alimentando barulho e exige que o disparo aconteça exatamente no instante
previsto.
