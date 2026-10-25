import type { ISystemOneProvider, RawResponse } from '../system-one/system-one.types';

export type RemoteEstimatorId = 'jev' | 'laya';

/** De quem e a nota que vale: um modelo, cru ou calibrado pelas notas humanas. */
export type SuggestionSourceId = RemoteEstimatorId | `${RemoteEstimatorId}-calibrated`;

export interface SuggestionSource {
  readonly id: SuggestionSourceId;
  readonly estimator: RemoteEstimatorId;
  readonly calibrated: boolean;
}

/** Um estimador que nem chegou a ser chamado, e por que. */
export interface UnavailableEstimator {
  readonly estimator: RemoteEstimatorId;
  readonly reason: string;
  /** Configurado, mas fora do ar: ainda responde o que esta no cache. */
  readonly cacheOnly?: boolean;
}

export interface ResolvedEstimators {
  readonly providers: readonly ISystemOneProvider<RemoteEstimatorId>[];
  readonly unavailable: readonly UnavailableEstimator[];
}

/** O ambiente ja com o `.env` do projeto por baixo do `process.env`. */
export type EstimatorEnvironment = Readonly<Record<string, string | undefined>>;

export interface ResolveEstimatorsOptions {
  readonly fetch?: typeof fetch;
  readonly onRawResponse?: (raw: RawResponse) => void;
}
