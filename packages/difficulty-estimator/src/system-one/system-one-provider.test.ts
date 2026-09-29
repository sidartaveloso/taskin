import { describe, expect, it, vi } from 'vitest';
import type { RawResponse, SystemOneProviderOptions, SystemOneRequest } from './system-one.types';
import { SystemOneError } from './system-one-error';
import { SystemOneProvider } from './system-one-provider';

const REQUEST: SystemOneRequest = {
  state: 'Titulo: corrigir o README',
  questions: {
    difficulty: { type: 'score', instructions: 'Quao dificil?', criteria: ['facil', 'medio', 'dificil'] },
  },
};

const ANSWER = {
  model: 'jev-latest',
  answers: {
    difficulty: {
      type: 'score',
      score: 0.4,
      legend: { '0': 'facil', '1': 'medio', '2': 'dificil' },
      probabilities: { '0': 0.7, '1': 0.2, '2': 0.1 },
      confidence: 0.6,
    },
  },
  usage: { input_tokens: 42, output_tokens: 0 },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function provider(fetch: typeof globalThis.fetch, extra: Partial<SystemOneProviderOptions> = {}) {
  return new SystemOneProvider({
    id: 'jev',
    baseUrl: 'https://api.example.test/',
    model: 'jev-latest',
    apiKey: 'test-key',
    backoffMs: 1,
    fetch,
    ...extra,
  });
}

const invoke = (p: SystemOneProvider, signal?: AbortSignal) =>
  p.invoke({ operation: 'difficulty', requestId: 'r1', payload: { data: REQUEST }, signal });

async function rejection(promise: Promise<unknown>): Promise<SystemOneError> {
  const falha = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  if (!(falha instanceof SystemOneError)) throw new Error(`expected a SystemOneError, got ${String(falha)}`);
  return falha;
}

describe('SystemOneProvider.invoke', () => {
  it('posts the System One body, with the model, the bearer key and the extra fields', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(ANSWER));
    await invoke(provider(fetch, { extraBody: { max_len: 2048 } }));

    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/v1/systemone');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toMatchObject({ authorization: 'Bearer test-key', 'content-type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual({ model: 'jev-latest', ...REQUEST, max_len: 2048 });
  });

  it('leaves the model out when none is configured, so laya-serve routes by language', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(ANSWER));
    await invoke(provider(fetch, { model: undefined, apiKey: undefined }));

    const init = fetch.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('model');
    expect(init?.headers).not.toHaveProperty('authorization');
  });

  it('returns the parsed score answer', async () => {
    const resposta = await invoke(provider(async () => json(ANSWER)));
    expect(resposta.answers.difficulty?.score).toBe(0.4);
    expect(resposta.usage?.input_tokens).toBe(42);
  });

  it('turns 401 into a non-transient unauthorized error', async () => {
    const falha = await rejection(invoke(provider(async () => json({ detail: 'bad key' }, 401))));
    expect(falha).toMatchObject({ code: 'unauthorized', transient: false, status: 401 });
  });

  it('turns 422 into invalid_request, with what the server said', async () => {
    const falha = await rejection(invoke(provider(async () => json({ detail: 'too many levels' }, 422))));
    expect(falha.code).toBe('invalid_request');
    expect(falha.message).toContain('too many levels');
  });

  it('retries a 429 with backoff and returns the answer that follows', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({}, 429))
      .mockResolvedValueOnce(json({}, 529))
      .mockResolvedValueOnce(json(ANSWER));
    const resposta = await invoke(provider(fetch));
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(resposta.model).toBe('jev-latest');
  });

  it('gives up after the retries, as a transient rate_limited error', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({}, 429));
    const falha = await rejection(invoke(provider(fetch, { retries: 1 })));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(falha).toMatchObject({ code: 'rate_limited', transient: true });
  });

  it('names the connection error when the server is down', async () => {
    const recusado = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    const falha = await rejection(
      invoke(
        provider(async () => {
          throw recusado;
        }),
      ),
    );
    expect(falha.code).toBe('unreachable');
    expect(falha.message).toBe('jev is not reachable at https://api.example.test (ECONNREFUSED)');
  });

  it('reports a timeout when the router aborts the call', async () => {
    const controller = new AbortController();
    const fetch = vi.fn<typeof globalThis.fetch>(async () => {
      controller.abort();
      throw new DOMException('aborted', 'AbortError');
    });
    const falha = await rejection(invoke(provider(fetch, { timeoutMs: 50 }), controller.signal));
    expect(falha).toMatchObject({ code: 'timeout', message: 'jev did not answer within 50 ms' });
  });

  it('keeps an unreadable body raw, and fails with invalid_response', async () => {
    const crus: RawResponse[] = [];
    const falha = await rejection(
      invoke(provider(async () => new Response('<html>oops</html>'), { onRawResponse: (raw) => crus.push(raw) })),
    );
    expect(falha.code).toBe('invalid_response');
    expect(crus).toEqual([{ provider: 'jev', status: 200, body: '<html>oops</html>', reason: 'the body is not JSON' }]);
  });

  it('refuses an answer that is not a score, keeping it raw', async () => {
    const crus: RawResponse[] = [];
    const escolha = { model: 'x', answers: { difficulty: { type: 'choice', choice: 'a' } } };
    const falha = await rejection(
      invoke(provider(async () => json(escolha), { onRawResponse: (raw) => crus.push(raw) })),
    );
    expect(falha.code).toBe('invalid_response');
    expect(crus[0]?.body).toContain('"choice"');
  });
});

describe('SystemOneProvider.probe', () => {
  it('does not call anything without a health path', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    expect(await provider(fetch).probe()).toEqual({ ok: true });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('is ok when the health route answers', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({ status: 'ok' }));
    expect(await provider(fetch, { healthPath: '/health' }).probe()).toEqual({ ok: true });
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.example.test/health');
  });

  it('says why when the server is down', async () => {
    const recusado = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    const saude = await provider(
      async () => {
        throw recusado;
      },
      { id: 'laya', healthPath: '/health' },
    ).probe();
    expect(saude).toEqual({
      ok: false,
      reason: 'laya is not reachable at https://api.example.test/health (ECONNREFUSED)',
    });
  });
});
