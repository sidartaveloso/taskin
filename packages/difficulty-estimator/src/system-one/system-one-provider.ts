import type { InvokeContext } from '@layerall/core';
import { SystemOneRequestSchema, SystemOneResponseSchema } from './system-one.schema';
import type { ISystemOneProvider, ProbeOutcome, SystemOneProviderOptions, SystemOneResponse } from './system-one.types';
import { SystemOneError } from './system-one-error';

const PROBE_TIMEOUT_MS = 5_000;
const BODY_EXCERPT = 300;

/**
 * Um `Provider` do layerall para `POST /v1/systemone`. O mesmo codigo serve ao
 * Jev e ao Laya: muda a URL, a chave e o que vai a mais no corpo.
 */
export class SystemOneProvider<TId extends string = string> implements ISystemOneProvider<TId> {
  readonly id: TId;
  readonly baseUrl: string;
  readonly model?: string;
  readonly timeoutMs?: number;
  readonly cacheIdentity: string;

  private readonly fetch: typeof fetch;

  constructor(private readonly options: SystemOneProviderOptions<TId>) {
    this.id = options.id;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.cacheIdentity = JSON.stringify({
      id: this.id,
      baseUrl: this.baseUrl,
      model: this.model ?? null,
      extraBody: options.extraBody ?? null,
    });
  }

  async invoke(ctx: InvokeContext<unknown>): Promise<SystemOneResponse> {
    const pedido = SystemOneRequestSchema.safeParse(ctx.payload.data);
    if (!pedido.success) {
      throw new SystemOneError(
        'invalid_request',
        `not a System One request: ${pedido.error.issues[0]?.message}`,
        false,
      );
    }
    const { state, questions } = pedido.data;
    const body = JSON.stringify({
      ...(this.model ? { model: this.model } : {}),
      state,
      questions,
      ...this.options.extraBody,
    });
    const retries = this.options.retries ?? 2;
    const backoffMs = this.options.backoffMs ?? 500;

    for (let attempt = 0; ; attempt++) {
      const response = await this.post(body, ctx.signal);
      const saturated = response.status === 429 || response.status === 529;
      if (saturated && attempt < retries) {
        await response.body?.cancel();
        await esperar(backoffMs * 2 ** attempt, ctx.signal);
        continue;
      }
      return this.read(response);
    }
  }

  async probe(signal?: AbortSignal): Promise<ProbeOutcome> {
    if (!this.options.healthPath) return { ok: true };
    const url = `${this.baseUrl}${this.options.healthPath}`;
    const timeout = AbortSignal.timeout(PROBE_TIMEOUT_MS);
    try {
      const response = await this.fetch(url, {
        headers: this.headers(),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
      await response.body?.cancel();
      if (response.ok) return { ok: true };
      return { ok: false, reason: `${this.id} answered HTTP ${response.status} at ${url}` };
    } catch (falha) {
      return { ok: false, reason: `${this.id} is not reachable at ${url} (${causa(falha)})` };
    }
  }

  private async post(body: string, signal?: AbortSignal): Promise<Response> {
    try {
      return await this.fetch(`${this.baseUrl}/v1/systemone`, {
        method: 'POST',
        headers: { ...this.headers(), 'content-type': 'application/json' },
        body,
        signal,
      });
    } catch (falha) {
      if (signal?.aborted) {
        const prazo = this.timeoutMs ? ` within ${this.timeoutMs} ms` : '';
        throw new SystemOneError('timeout', `${this.id} did not answer${prazo}`, true);
      }
      throw new SystemOneError('unreachable', `${this.id} is not reachable at ${this.baseUrl} (${causa(falha)})`, true);
    }
  }

  private async read(response: Response): Promise<SystemOneResponse> {
    const text = await response.text();
    if (!response.ok) throw this.httpError(response.status, text);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw this.invalidResponse(response.status, text, 'the body is not JSON');
    }
    const parsed = SystemOneResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw this.invalidResponse(response.status, text, parsed.error.issues[0]?.message ?? 'unexpected shape');
    }
    return parsed.data;
  }

  private httpError(status: number, text: string): SystemOneError {
    const trecho = text.slice(0, BODY_EXCERPT);
    if (status === 401 || status === 403) {
      return new SystemOneError('unauthorized', `${this.id} refused the credentials (HTTP ${status})`, false, status);
    }
    if (status === 400 || status === 422) {
      return new SystemOneError(
        'invalid_request',
        `${this.id} rejected the request (HTTP ${status}): ${trecho}`,
        false,
        status,
      );
    }
    if (status === 429) {
      return new SystemOneError('rate_limited', `${this.id} is rate limiting (HTTP 429)`, true, status);
    }
    if (status === 503 || status === 529) {
      return new SystemOneError('overloaded', `${this.id} is overloaded (HTTP ${status})`, true, status);
    }
    return new SystemOneError('server_error', `${this.id} failed (HTTP ${status}): ${trecho}`, status >= 500, status);
  }

  private invalidResponse(status: number, body: string, reason: string): SystemOneError {
    this.options.onRawResponse?.({ provider: this.id, status, body, reason });
    return new SystemOneError('invalid_response', `${this.id} sent an unreadable answer: ${reason}`, false, status);
  }

  private headers(): Record<string, string> {
    return this.options.apiKey ? { authorization: `Bearer ${this.options.apiKey}` } : {};
  }
}

/** O `ECONNREFUSED` que o `fetch` do Node esconde em `cause`. */
function causa(falha: unknown): string {
  if (falha instanceof Error) {
    const cause = falha.cause;
    if (cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string') return cause.code;
    return falha.message;
  }
  return String(falha);
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new SystemOneError('timeout', 'aborted while backing off', true));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new SystemOneError('timeout', 'aborted while backing off', true));
      },
      { once: true },
    );
  });
}
