import type { Provider } from '@layerall/core';

/**
 * Um modelo que fala `POST /v1/systemone` — o Jev (TypeSafe) ou o Laya
 * (`laya-serve`), que responde com o mesmo schema. E um `Provider` do layerall,
 * para o Router chamar os dois de uma vez em `fan_out`; o Router entrega o
 * `payload` como `unknown`, e o provider confere que e um {@link SystemOneRequest}.
 */
export interface ISystemOneProvider<TId extends string = string> extends Provider<unknown, SystemOneResponse> {
  readonly id: TId;
  readonly baseUrl: string;
  readonly model?: string;
  /** Tudo que muda a resposta alem da pergunta: entra na chave do cache. */
  readonly cacheIdentity: string;
  /** Pergunta se o servidor esta no ar antes da rinha, para o W.O. sair com motivo e nao task a task. */
  probe(signal?: AbortSignal): Promise<ProbeOutcome>;
}

export interface ScoreQuestion {
  readonly type: 'score';
  readonly instructions: string;
  /** De 2 a 10 niveis, do menor para o maior. */
  readonly criteria: readonly string[];
}

export interface SystemOneRequest {
  readonly state: string;
  readonly questions: Readonly<Record<string, ScoreQuestion>>;
}

export interface ScoreAnswer {
  readonly type: 'score';
  /** Nivel esperado, de 0 a n-1, ponderado pelas probabilidades. */
  readonly score: number;
  readonly legend: Readonly<Record<string, string>>;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly confidence?: number;
  /** So o Laya manda; o proprio README diz que e mais confiavel que `confidence`. */
  readonly answer_confidence?: number;
}

export interface SystemOneUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
}

export interface SystemOneResponse {
  readonly model: string;
  readonly answers: Readonly<Record<string, ScoreAnswer>>;
  readonly usage?: SystemOneUsage;
}

export type SystemOneErrorCode =
  | 'unauthorized'
  | 'invalid_request'
  | 'rate_limited'
  | 'overloaded'
  | 'server_error'
  | 'unreachable'
  | 'timeout'
  | 'invalid_response';

/** Resposta que nao deu para ler, guardada crua para quem for investigar. */
export interface RawResponse {
  readonly provider: string;
  readonly status: number;
  readonly body: string;
  readonly reason: string;
}

export type ProbeOutcome = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export interface SystemOneProviderOptions<TId extends string = string> {
  readonly id: TId;
  readonly baseUrl: string;
  /** Sem modelo, o `laya-serve` escolhe o checkpoint pela lingua do texto. */
  readonly model?: string;
  readonly apiKey?: string;
  /** Rota de saude (`/health` no `laya-serve`); sem ela, o `probe` nao pergunta nada. */
  readonly healthPath?: string;
  /** Campos a mais no corpo, como o `max_len` que so o `laya-serve` aceita. */
  readonly extraBody?: Readonly<Record<string, unknown>>;
  readonly timeoutMs?: number;
  /** Novas tentativas depois de um 429 ou 529. */
  readonly retries?: number;
  readonly backoffMs?: number;
  readonly fetch?: typeof fetch;
  readonly onRawResponse?: (raw: RawResponse) => void;
}
