import { describe, expect, it, vi } from 'vitest';
import { createNoiseDispatcher, DEFAULT_NOISE_DEBOUNCE_MS, type NoiseProgress } from './noise-watcher';

describe('createNoiseDispatcher', () => {
  it('fires the callback when a sample reaches the threshold', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.6, 0);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does not fire while the sample stays below the threshold', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.4, 0);
    dispatcher.dispatch(0.49, 500);

    expect(cb).not.toHaveBeenCalled();
  });

  it('treats a sample exactly at the threshold as loud enough', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.5, 0);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('debounces repeated loud samples inside the window', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 500);
    dispatcher.dispatch(0.9, 900);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('fires again once the debounce window has passed', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 1500);

    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('uses the default debounce when none is given', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, DEFAULT_NOISE_DEBOUNCE_MS - 1);
    expect(cb).toHaveBeenCalledTimes(1);

    dispatcher.dispatch(0.9, DEFAULT_NOISE_DEBOUNCE_MS + 1);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('stops firing after the listener is unsubscribed', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    const unsub = dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    unsub();
    dispatcher.dispatch(0.9, 5000);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('reports the latest level and pushes it to level subscribers', () => {
    const dispatcher = createNoiseDispatcher();
    const levels: number[] = [];
    dispatcher.subscribeLevel((rms) => levels.push(rms));

    dispatcher.dispatch(0.12, 0);
    dispatcher.dispatch(0.34, 100);

    // includes the immediate 0 replayed on subscribe
    expect(levels).toEqual([0, 0.12, 0.34]);
    expect(dispatcher.getCurrentLevel()).toBe(0.34);
  });

  it('stops pushing levels after the level subscriber unsubscribes', () => {
    const dispatcher = createNoiseDispatcher();
    const levels: number[] = [];
    const unsub = dispatcher.subscribeLevel((rms) => levels.push(rms));

    dispatcher.dispatch(0.12, 0);
    unsub();
    dispatcher.dispatch(0.34, 100);

    expect(levels).toEqual([0, 0.12]);
  });

  it('isolates a throwing callback from the other listeners', () => {
    const dispatcher = createNoiseDispatcher();
    const good = vi.fn();
    dispatcher.onNoiseAbove(
      0.5,
      () => {
        throw new Error('boom');
      },
      1000,
    );
    dispatcher.onNoiseAbove(0.5, good, 1000);

    expect(() => dispatcher.dispatch(0.9, 0)).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });
});

/**
 * `sustainMs` responde a uma pergunta diferente da do `debounceMs`: quanto
 * tempo o barulho precisa se manter alto ANTES do primeiro disparo, contra
 * quanto tempo precisa passar DEPOIS dele ate o proximo. Sem sustentacao, um
 * estalo de porta pede silencio igual a um minuto de conversa alta.
 */
describe('createNoiseDispatcher com sustentacao', () => {
  it('nao dispara enquanto o barulho nao completa o tempo de sustentacao', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 1000 });

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 400);
    dispatcher.dispatch(0.9, 999);

    expect(cb).not.toHaveBeenCalled();
  });

  it('dispara quando o nivel se mantem acima do limiar pelo tempo pedido', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 1000 });

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 500);
    dispatcher.dispatch(0.9, 1000);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  /*
   * Este teste ja exigiu o contrario: na primeira versao uma amostra baixa
   * zerava o acumulo. O criterio mudou porque ele nao detectava fala — uma
   * pausa entre palavras nao e silencio na sala, e agora nao desfaz o que ja
   * foi medido.
   */
  it('nao deixa uma pausa curta desfazer o que ja foi medido', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 1000 });

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 900);
    dispatcher.dispatch(0.1, 950);
    dispatcher.dispatch(0.9, 1000);

    // tres altas contra uma baixa na janela: 75%, acima da fracao padrao
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('sem sustentacao, mantem o comportamento de disparar na primeira amostra alta', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { debounceMs: 1000 });

    dispatcher.dispatch(0.9, 0);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('conta o debounce a partir do disparo, nao do inicio do barulho', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 500, debounceMs: 1000 });

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 500); // completa a sustentacao: dispara
    expect(cb).toHaveBeenCalledTimes(1);

    // 1200 ja passou de 1000ms desde o inicio do barulho, mas nao desde o disparo
    dispatcher.dispatch(0.9, 1200);
    expect(cb).toHaveBeenCalledTimes(1);

    dispatcher.dispatch(0.9, 1600);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('aceita o terceiro argumento numerico como debounce, como antes', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, 1000);

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 900);
    dispatcher.dispatch(0.9, 1100);

    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('usa o debounce padrao quando o objeto de opcoes so traz a sustentacao', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 200 });

    dispatcher.dispatch(0.9, 0);
    dispatcher.dispatch(0.9, 200);
    expect(cb).toHaveBeenCalledTimes(1);

    dispatcher.dispatch(0.9, 200 + DEFAULT_NOISE_DEBOUNCE_MS - 1);
    expect(cb).toHaveBeenCalledTimes(1);

    dispatcher.dispatch(0.9, 200 + DEFAULT_NOISE_DEBOUNCE_MS + 1);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});

/**
 * Uma fala nao e um plato: entre silabas e frases ha vales de 100 a 400ms. O
 * criterio de sustentacao continua zera o acumulo em cada vale, entao detecta
 * um secador de cabelo e nao detecta gente conversando — que e o caso para o
 * qual a reacao existe. Por isso a sustentacao e medida como FRACAO de uma
 * janela deslizante, e nao como sequencia ininterrupta.
 */
describe('createNoiseDispatcher com fracao da janela', () => {
  const PASSO = 40;

  /** Alimenta `padrao` (true = alto) repetido, uma amostra a cada `PASSO` ms. */
  const alimentar = (
    dispatcher: ReturnType<typeof createNoiseDispatcher>,
    padrao: boolean[],
    repeticoes: number,
    inicio = 0,
  ): number => {
    let t = inicio;
    for (let r = 0; r < repeticoes; r++) {
      for (const alto of padrao) {
        dispatcher.dispatch(alto ? 0.9 : 0.01, t);
        t += PASSO;
      }
    }
    return t;
  };

  it('dispara com uma fala alta que tem pausas entre as palavras', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 2000, sustainRatio: 0.6 });

    // 4 amostras altas (160ms de palavra) e 1 baixa (40ms de pausa): 80% da janela
    alimentar(dispatcher, [true, true, true, true, false], 12);

    expect(cb).toHaveBeenCalled();
  });

  it('nao dispara com uma porta batendo no meio do silencio', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 2000, sustainRatio: 0.6 });

    // uma unica amostra alta a cada 20 (5% da janela)
    alimentar(dispatcher, [true, ...Array(19).fill(false)], 6);

    expect(cb).not.toHaveBeenCalled();
  });

  it('nao dispara antes de a janela estar cheia, por mais alto que esteja', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 2000, sustainRatio: 0.6 });

    // 1s inteiro de barulho continuo, metade da janela pedida
    alimentar(dispatcher, [true], 25);

    expect(cb).not.toHaveBeenCalled();

    alimentar(dispatcher, [true], 26, 25 * PASSO);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('com ratio 1 volta a exigir barulho ininterrupto', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 1000, sustainRatio: 1 });

    // a mesma fala com pausas do primeiro caso nao basta aqui
    alimentar(dispatcher, [true, true, true, true, false], 12);
    expect(cb).not.toHaveBeenCalled();
  });

  it('ignora a fracao quando nao ha janela de sustentacao', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 0, sustainRatio: 0.6 });

    dispatcher.dispatch(0.9, 0);

    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('esquece o barulho que saiu da janela', () => {
    const dispatcher = createNoiseDispatcher();
    const cb = vi.fn();
    dispatcher.onNoiseAbove(0.5, cb, { sustainMs: 1000, sustainRatio: 0.6 });

    // 1s de barulho seguido de 1s de silencio: quando a janela enche de novo,
    // o barulho antigo ja saiu dela e nao conta
    alimentar(dispatcher, [true], 26);
    expect(cb).toHaveBeenCalledTimes(1);

    const t = alimentar(dispatcher, [false], 25, 26 * PASSO);
    alimentar(dispatcher, [true, false, false], 8, t);
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

/**
 * O pedido original era um relogio regressivo desde o inicio do barulho. Nesse
 * criterio ele nao existe: o disparo depende do que ainda vai acontecer, e uma
 * pausa longa AUMENTA o tempo que falta. O que o debug mostra e o estado real —
 * quanto falta para a janela encher, a ocupacao contra a exigida, o debounce, e
 * uma previsao explicitamente condicionada a o barulho continuar.
 */
describe('createNoiseDispatcher: progresso para o debug', () => {
  const PASSO = 40;

  it('relata a ocupacao da janela e a fracao exigida', () => {
    const dispatcher = createNoiseDispatcher();
    let progresso: NoiseProgress | null = null;
    dispatcher.onNoiseAbove(0.5, () => {}, {
      sustainMs: 400,
      sustainRatio: 0.6,
      onProgress: (p) => {
        progresso = p;
      },
    });

    /*
     * Uma janela de 400ms a 40ms por amostra guarda 11 amostras: as dez
     * anteriores mais a atual. Alimentando exatamente essas onze, com tres
     * altas, a ocupacao e 3/11 — contar "1 em cada 4" daria 0.25 e erraria,
     * porque a borda da janela nao cai num multiplo do padrao.
     */
    const altas = new Set([0, 4, 8]);
    for (let i = 0; i < 11; i++) {
      dispatcher.dispatch(altas.has(i) ? 0.9 : 0.01, i * PASSO);
    }

    expect(progresso).not.toBeNull();
    expect((progresso as unknown as NoiseProgress).ratio).toBeCloseTo(3 / 11, 5);
    expect((progresso as unknown as NoiseProgress).requiredRatio).toBe(0.6);
  });

  it('conta quanto falta para a janela ficar coberta', () => {
    const dispatcher = createNoiseDispatcher();
    let progresso: NoiseProgress | null = null;
    dispatcher.onNoiseAbove(0.5, () => {}, {
      sustainMs: 1000,
      onProgress: (p) => {
        progresso = p;
      },
    });

    dispatcher.dispatch(0.9, 0);
    expect((progresso as unknown as NoiseProgress).msUntilWindowFull).toBe(1000);

    dispatcher.dispatch(0.9, 600);
    expect((progresso as unknown as NoiseProgress).msUntilWindowFull).toBe(400);

    dispatcher.dispatch(0.9, 1000);
    expect((progresso as unknown as NoiseProgress).msUntilWindowFull).toBe(0);
  });

  it('mostra o debounce correndo depois de um disparo', () => {
    const dispatcher = createNoiseDispatcher();
    let progresso: NoiseProgress | null = null;
    dispatcher.onNoiseAbove(0.5, () => {}, {
      sustainMs: 0,
      debounceMs: 2000,
      onProgress: (p) => {
        progresso = p;
      },
    });

    dispatcher.dispatch(0.9, 0);
    expect((progresso as unknown as NoiseProgress).msUntilDebounceOver).toBe(2000);

    dispatcher.dispatch(0.9, 1500);
    expect((progresso as unknown as NoiseProgress).msUntilDebounceOver).toBe(500);

    // amostra baixa: nao dispara, entao da para ver a contagem zerada
    dispatcher.dispatch(0.01, 2001);
    expect((progresso as unknown as NoiseProgress).msUntilDebounceOver).toBe(0);

    // e uma amostra alta no mesmo instante dispara e reinicia a contagem
    dispatcher.dispatch(0.9, 2001);
    expect((progresso as unknown as NoiseProgress).msUntilDebounceOver).toBe(2000);
  });

  it('preve o disparo, e a previsao bate com o que acontece', () => {
    const dispatcher = createNoiseDispatcher();
    const disparos: number[] = [];
    let progresso: NoiseProgress | null = null;
    let agora = 0;

    dispatcher.onNoiseAbove(
      0.5,
      () => {
        disparos.push(agora);
      },
      {
        sustainMs: 1000,
        sustainRatio: 0.6,
        debounceMs: 0,
        onProgress: (p) => {
          progresso = p;
        },
      },
    );

    // alternando alto e baixo: ocupacao em torno de 50%, abaixo dos 60% exigidos
    for (let i = 0; i < 40; i++) {
      dispatcher.dispatch(i % 2 === 0 ? 0.9 : 0.01, agora);
      agora += PASSO;
    }
    expect(disparos).toHaveLength(0);

    const momentoDaPrevisao = agora - PASSO;
    const previsto = (progresso as unknown as NoiseProgress).msUntilFire;
    expect(previsto).not.toBeNull();
    expect(previsto as number).toBeGreaterThan(0);

    // a partir daqui, so barulho — exatamente a condicao da previsao
    for (let i = 0; i < 60 && disparos.length === 0; i++) {
      dispatcher.dispatch(0.9, agora);
      agora += PASSO;
    }

    expect(disparos).toHaveLength(1);
    expect((disparos[0] as number) - momentoDaPrevisao).toBe(previsto);
  });

  it('nao promete disparo nenhum quando ainda nao ha o que medir', () => {
    const dispatcher = createNoiseDispatcher();
    let progresso: NoiseProgress | null = null;
    dispatcher.onNoiseAbove(0.5, () => {}, {
      sustainMs: 1000,
      onProgress: (p) => {
        progresso = p;
      },
    });

    dispatcher.dispatch(0.01, 0);

    // uma amostra so nao da nem para estimar o intervalo entre amostras
    expect((progresso as unknown as NoiseProgress).msUntilFire).toBeNull();
  });
});
