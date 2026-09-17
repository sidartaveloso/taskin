# 🧩 Task 095 — o debug mostra o quanto falta para o shhh disparar

- Status: in-progress
- Type: feat
- Assignee: Sidarta Veloso

## Description
No criterio de fracao da janela nao existe um relogio regressivo simples: o disparo depende do que vier a seguir. O debug passa a mostrar o estado real do criterio — quanto falta para a janela ficar coberta, a ocupacao atual contra a exigida, quanto falta do debounce, e uma previsao de quanto falta para disparar SE o barulho continuar no ritmo atual.

## Tasks
<!-- [x] feito · [ ] em aberto · [ ] ... — adiado: <razão> para o que se decidiu não fazer -->

### Estado do critério no núcleo (`@opentask/ui-sense`)
- [ ] Testes antes do código: a ocupação relatada bate com a fração de amostras altas; `msUntilWindowFull` cai até zero conforme a janela enche; o debounce aparece como tempo restante; a previsão de disparo bate com o disparo real quando o barulho continua
- [ ] `NoiseProgress` e a opção `onProgress` em `onNoiseAbove`, chamada a cada amostra depois da decisão de disparar
- [ ] Previsão simulando amostras altas futuras até a fração cruzar a exigida, com passo estimado das próprias amostras

### Debug do componente
- [ ] `TaskinWithShhh` assina o `onProgress` e leva os números ao `debugInfo`, em texto legível no painel `Shhh Detection`
- [ ] Story `BrunoShhh` com o debug ligado mostrando o estado

### Fechamento
- [ ] `MASCOT_NOISE_REACTION.md` e changeset
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm test`

## Notes

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
