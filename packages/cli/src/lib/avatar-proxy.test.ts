import { describe, expect, it, vi } from 'vitest';
import { type AvatarRequest, type AvatarResponse, createAvatarHandler } from './avatar-proxy.js';

const VALID_HASH = '3664adb7d1eea0bd7d0b134577663889';

interface RecordedResponse extends AvatarResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: string | Buffer;
}

function makeRes(): RecordedResponse {
  const res: RecordedResponse = {
    statusCode: 200,
    headers: {},
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    set(field: string, value: string) {
      this.headers[field] = value;
      return this;
    },
    send(body?: string | Buffer) {
      this.body = body;
      return this;
    },
  };
  return res;
}

function req(hash?: string): AvatarRequest {
  return { params: { hash } };
}

function imageResponse(bytes = Buffer.from([1, 2, 3]), contentType = 'image/jpeg'): Response {
  return {
    ok: true,
    headers: new Headers({ 'content-type': contentType }),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Response;
}

describe('createAvatarHandler', () => {
  it('rejects a hash that is not 32 hex chars without fetching', async () => {
    const fetchImpl = vi.fn();
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = makeRes();

    await handler(req('../etc/passwd'), res);

    expect(res.statusCode).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('proxies the provider image on success and serves it same-origin', async () => {
    const fetchImpl = vi.fn(async (_url: string) => imageResponse(Buffer.from([9, 9, 9]), 'image/png'));
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = makeRes();

    await handler(req(VALID_HASH), res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('image/png');
    expect(res.headers['Cache-Control']).toContain('max-age=');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const url = fetchImpl.mock.calls[0]![0];
    expect(url).toContain(VALID_HASH);
    expect(url).toContain('d=404');
  });

  it('serves a second request from cache without fetching again', async () => {
    const fetchImpl = vi.fn(async () => imageResponse());
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch });

    await handler(req(VALID_HASH), makeRes());
    await handler(req(VALID_HASH), makeRes());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('re-fetches once the cache entry has expired', async () => {
    const fetchImpl = vi.fn(async () => imageResponse());
    let clock = 1000;
    const handler = createAvatarHandler({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      ttlMs: 500,
      now: () => clock,
    });

    await handler(req(VALID_HASH), makeRes());
    clock += 1000; // past the 500ms TTL
    await handler(req(VALID_HASH), makeRes());

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns 404 when the provider has no avatar, so the UI shows initials', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404, headers: new Headers() }) as unknown as Response);
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const res = makeRes();

    await handler(req(VALID_HASH), res);

    expect(res.statusCode).toBe(404);
  });

  it('caches the negative result so a missing avatar is not re-fetched', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404, headers: new Headers() }) as unknown as Response);
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch });

    await handler(req(VALID_HASH), makeRes());
    await handler(req(VALID_HASH), makeRes());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns 504 and does not cache when the provider does not respond', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const res = makeRes();
    await handler(req(VALID_HASH), res);
    expect(res.statusCode).toBe(504);

    // Transient failures must not stick: the next load retries.
    await handler(req(VALID_HASH), makeRes());
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('aborts the provider request after the timeout', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const handler = createAvatarHandler({ fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 10 });
    const res = makeRes();

    await handler(req(VALID_HASH), res);

    expect(res.statusCode).toBe(504);
  });
});
