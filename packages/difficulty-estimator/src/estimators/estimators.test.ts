import { describe, expect, it, vi } from 'vitest';
import { resolveEstimators } from './estimators';

const ANSWER = { model: 'm', answers: {}, usage: { input_tokens: 1, output_tokens: 0 } };

async function corpoEnviado(env: Record<string, string>, id: string): Promise<Record<string, unknown>> {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify(ANSWER)));
  const provider = resolveEstimators(env, { fetch }).providers.find((p) => p.id === id);
  await provider?.invoke({
    operation: 'difficulty',
    requestId: 'r',
    payload: { data: { state: 's', questions: {} } },
  });
  const [url, init] = fetch.mock.calls[0] ?? [];
  return { url, headers: init?.headers, ...JSON.parse(String(init?.body)) };
}

describe('resolveEstimators', () => {
  it('leaves Jev out, with the reason, when TYPESAFE_API_KEY is missing', () => {
    const { providers, unavailable } = resolveEstimators({});
    expect(providers.map((p) => p.id)).toEqual(['laya']);
    expect(unavailable).toEqual([
      { estimator: 'jev', reason: 'TYPESAFE_API_KEY is not set (in .env or in the environment)' },
    ]);
  });

  it('treats a blank key as missing', () => {
    expect(resolveEstimators({ TYPESAFE_API_KEY: '   ' }).unavailable).toHaveLength(1);
  });

  it('calls Jev on the TypeSafe API, with jev-latest and the key', async () => {
    const enviado = await corpoEnviado({ TYPESAFE_API_KEY: 'k' }, 'jev');
    expect(enviado.url).toBe('https://api.typesafe.ai/v1/systemone');
    expect(enviado.model).toBe('jev-latest');
    expect(enviado.headers).toMatchObject({ authorization: 'Bearer k' });
  });

  it('calls Laya on localhost:8000, without a model and with max_len', async () => {
    const enviado = await corpoEnviado({}, 'laya');
    expect(enviado.url).toBe('http://localhost:8000/v1/systemone');
    expect(enviado).not.toHaveProperty('model');
    expect(enviado.max_len).toBe(2048);
  });

  it('takes the URLs, models and max_len from the environment', async () => {
    const env = {
      TYPESAFE_API_KEY: 'k',
      JEV_URL: 'http://127.0.0.1:9/',
      JEV_MODEL: 'jev-1',
      LAYA_URL: 'http://127.0.0.1:7',
      LAYA_MODEL: 'multilingual',
      LAYA_MAX_LEN: '4096',
    };
    const jev = await corpoEnviado(env, 'jev');
    const laya = await corpoEnviado(env, 'laya');
    expect(jev).toMatchObject({ url: 'http://127.0.0.1:9/v1/systemone', model: 'jev-1' });
    expect(laya).toMatchObject({ url: 'http://127.0.0.1:7/v1/systemone', model: 'multilingual', max_len: 4096 });
  });
});
