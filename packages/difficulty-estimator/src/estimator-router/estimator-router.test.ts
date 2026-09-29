import { describe, expect, it, vi } from 'vitest';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import { resolveEstimators } from '../estimators/estimators';
import { RinhaStoreMemory } from '../rinha-store/rinha-store.memory';
import { EstimatorRouter } from './estimator-router';

const TASK: TaskForEstimate = {
  id: '141',
  title: 'Jev x Laya',
  type: 'feat',
  markdown: '# X\n\n## Description\nSugerir a dificuldade.',
};

const resposta = (score: number) =>
  new Response(
    JSON.stringify({
      model: 'm',
      answers: {
        difficulty: { type: 'score', score, legend: {}, probabilities: { '0': 1 }, answer_confidence: 0.4 },
      },
      usage: { input_tokens: 80, output_tokens: 0 },
    }),
  );

const recusado = () => Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });

/** Um `fetch` que responde conforme o host: `jev.test` e `laya.test`. */
function servidores(jev: () => Response | Error, laya: () => Response | Error) {
  return vi.fn<typeof globalThis.fetch>(async (url) => {
    const alvo = String(url).includes('jev.test') ? jev() : laya();
    if (alvo instanceof Error) throw alvo;
    return alvo;
  });
}

const ENV = { TYPESAFE_API_KEY: 'k', JEV_URL: 'http://jev.test', LAYA_URL: 'http://laya.test' };

describe('EstimatorRouter.ask', () => {
  it('asks Jev and Laya in the same fan_out, and gives one outcome each', async () => {
    const fetch = servidores(
      () => resposta(3.2),
      () => resposta(0.8),
    );
    const router = new EstimatorRouter(resolveEstimators(ENV, { fetch }), new RinhaStoreMemory());

    const [jev, laya] = await router.ask(TASK);
    expect(jev).toMatchObject({ kind: 'answered', estimator: 'jev', estimate: { difficulty: 4 }, inputTokens: 80 });
    expect(laya).toMatchObject({ kind: 'answered', estimator: 'laya', estimate: { difficulty: 2, confidence: 0.4 } });
    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls).toEqual(expect.arrayContaining(['http://jev.test/v1/systemone', 'http://laya.test/v1/systemone']));
  });

  it('keeps one answer when the other model fails', async () => {
    const fetch = servidores(
      () => new Response('{}', { status: 401 }),
      () => resposta(1),
    );
    const [jev, laya] = await new EstimatorRouter(resolveEstimators(ENV, { fetch }), new RinhaStoreMemory()).ask(TASK);
    expect(jev).toMatchObject({ kind: 'failed', reason: 'jev refused the credentials (HTTP 401)' });
    expect(laya).toMatchObject({ kind: 'answered', estimate: { difficulty: 2 } });
  });

  it('never calls Jev without a key, and says why', async () => {
    const fetch = servidores(
      () => resposta(4),
      () => resposta(2),
    );
    const env = { LAYA_URL: 'http://laya.test' };
    const [jev] = await new EstimatorRouter(resolveEstimators(env, { fetch }), new RinhaStoreMemory()).ask(TASK);
    expect(jev).toEqual({
      kind: 'unavailable',
      estimator: 'jev',
      reason: 'TYPESAFE_API_KEY is not set (in .env or in the environment)',
    });
    expect(fetch.mock.calls.every(([url]) => !String(url).includes('jev.test'))).toBe(true);
  });

  it('answers from the cache the second time, with the original latency, without calling anyone', async () => {
    const fetch = servidores(
      () => resposta(2),
      () => resposta(2),
    );
    const store = new RinhaStoreMemory();
    const router = new EstimatorRouter(resolveEstimators(ENV, { fetch }), store);
    const [primeira] = await router.ask(TASK);
    fetch.mockClear();

    const [jev, laya] = await router.ask(TASK);
    expect(fetch).not.toHaveBeenCalled();
    expect(jev).toMatchObject({
      kind: 'answered',
      fromCache: true,
      latencyMs: primeira?.kind === 'answered' ? primeira.latencyMs : -1,
    });
    expect(laya).toMatchObject({ kind: 'answered', fromCache: true });
  });

  it('asks only the model that is missing from the cache', async () => {
    const fetch = servidores(
      () => resposta(2),
      () => recusado(),
    );
    const router = new EstimatorRouter(resolveEstimators(ENV, { fetch }), new RinhaStoreMemory());
    await router.ask(TASK);
    fetch.mockClear();

    await router.ask(TASK);
    expect(fetch.mock.calls.map(([url]) => String(url))).toEqual(['http://laya.test/v1/systemone']);
  });

  it('asks again when a different task text changes the key', async () => {
    const fetch = servidores(
      () => resposta(2),
      () => resposta(2),
    );
    const router = new EstimatorRouter(resolveEstimators(ENV, { fetch }), new RinhaStoreMemory());
    await router.ask(TASK);
    fetch.mockClear();
    await router.ask({ ...TASK, markdown: `${TASK.markdown}\nMais uma linha.` });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ignores the cache when told to', async () => {
    const fetch = servidores(
      () => resposta(2),
      () => resposta(2),
    );
    const store = new RinhaStoreMemory();
    await new EstimatorRouter(resolveEstimators(ENV, { fetch }), store).ask(TASK);
    fetch.mockClear();
    await new EstimatorRouter(resolveEstimators(ENV, { fetch }), store, { useCache: false }).ask(TASK);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failure', async () => {
    const fetch = servidores(
      () => resposta(2),
      () => new Response('boom', { status: 500 }),
    );
    const store = new RinhaStoreMemory();
    await new EstimatorRouter(resolveEstimators(ENV, { fetch }), store).ask(TASK);
    expect(store.answers.size).toBe(1);
  });
});

describe('EstimatorRouter.probe', () => {
  it('takes Laya out, with the reason, when laya-serve is down', async () => {
    const fetch = servidores(
      () => resposta(2),
      () => recusado(),
    );
    const router = new EstimatorRouter(resolveEstimators(ENV, { fetch }), new RinhaStoreMemory());
    await router.probe();

    expect(router.unavailable()).toEqual([
      { estimator: 'laya', reason: 'laya is not reachable at http://laya.test/health (ECONNREFUSED)', cacheOnly: true },
    ]);
    fetch.mockClear();
    const [jev, laya] = await router.ask(TASK);
    expect(jev?.kind).toBe('answered');
    expect(laya?.kind).toBe('unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('still answers from the cache for a model that is down', async () => {
    let layaNoAr = true;
    const fetch = servidores(
      () => resposta(2),
      () => (layaNoAr ? resposta(0.8) : recusado()),
    );
    const store = new RinhaStoreMemory();
    await new EstimatorRouter(resolveEstimators(ENV, { fetch }), store).ask(TASK);

    layaNoAr = false;
    fetch.mockClear();
    const router = new EstimatorRouter(resolveEstimators(ENV, { fetch }), store);
    await router.probe();
    const [, laya] = await router.ask(TASK);
    const outra = await router.ask({ ...TASK, id: '142', markdown: 'outra task' });

    expect(laya).toMatchObject({ kind: 'answered', fromCache: true, estimate: { difficulty: 2 } });
    expect(outra[1]).toMatchObject({ kind: 'unavailable', reason: expect.stringContaining('ECONNREFUSED') });
    const chamadasAoLaya = fetch.mock.calls.filter(([url]) => String(url).includes('laya.test/v1'));
    expect(chamadasAoLaya).toHaveLength(0);
  });
});
