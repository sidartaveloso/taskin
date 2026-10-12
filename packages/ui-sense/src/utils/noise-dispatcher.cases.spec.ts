import { describe, expect, it } from 'vitest';
import tabela from './__fixtures__/noise-dispatcher.cases.json';
import { createNoiseDispatcher, type NoiseProgress, type NoiseThresholdTiming } from './noise-watcher';

/**
 * A tabela de casos e o contrato com o detector em Kotlin do app do relogio
 * (`packages/mascote-wear`): os dois lados rodam os mesmos casos. Um caso que
 * so passa aqui e divergencia, e nao detalhe.
 */
type Caso = {
  nome: string;
  threshold: number;
  timing: number | { debounceMs?: number; sustainMs?: number; sustainRatio?: number } | null;
  samples: number[][];
  unsubscribeAt?: number;
  trackProgress?: boolean;
  expected: { fires: number[]; lastLevel: number; progress?: (NoiseProgress & { t: number })[] };
};

const casos = tabela.cases as Caso[];

describe('createNoiseDispatcher contra a tabela compartilhada com o Kotlin', () => {
  it('a tabela tem casos', () => {
    expect(casos.length).toBeGreaterThan(0);
  });

  it.each(casos.map((c) => [c.nome, c] as const))('%s', (_nome, c) => {
    const dispatcher = createNoiseDispatcher();
    const fires: number[] = [];
    const progress: (NoiseProgress & { t: number })[] = [];
    let agora = 0;

    const timing: NoiseThresholdTiming | undefined =
      c.timing === null
        ? undefined
        : typeof c.timing === 'number'
          ? c.timing
          : {
              ...c.timing,
              ...(c.trackProgress ? { onProgress: (p: NoiseProgress) => progress.push({ t: agora, ...p }) } : {}),
            };
    const cancelar = dispatcher.onNoiseAbove(c.threshold, () => fires.push(agora), timing);

    for (const [t, rms] of c.samples as [number, number][]) {
      if (c.unsubscribeAt !== undefined && t >= c.unsubscribeAt) cancelar();
      agora = t;
      dispatcher.dispatch(rms, t);
    }

    expect(fires).toEqual(c.expected.fires);
    expect(dispatcher.getCurrentLevel()).toBe(c.expected.lastLevel);
    if (c.expected.progress) expect(progress).toEqual(c.expected.progress);
  });
});
