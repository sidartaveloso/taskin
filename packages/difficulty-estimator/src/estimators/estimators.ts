import type { ISystemOneProvider } from '../system-one/system-one.types';
import { SystemOneProvider } from '../system-one/system-one-provider';
import type {
  EstimatorEnvironment,
  RemoteEstimatorId,
  ResolvedEstimators,
  ResolveEstimatorsOptions,
  UnavailableEstimator,
} from './estimators.types';

export const REMOTE_ESTIMATORS: readonly RemoteEstimatorId[] = ['jev', 'laya'];

export function isRemoteEstimator(id: string): id is RemoteEstimatorId {
  return (REMOTE_ESTIMATORS as readonly string[]).includes(id);
}

export const JEV_DEFAULT_URL = 'https://api.typesafe.ai';
export const JEV_DEFAULT_MODEL = 'jev-latest';
export const LAYA_DEFAULT_URL = 'http://localhost:8000';
export const LAYA_DEFAULT_MAX_LEN = 2048;

/**
 * O Jev e hospedado e pede `TYPESAFE_API_KEY`; sem ela ele nao e chamado, e a
 * rinha registra por que. O Laya roda local pelo `laya-serve` e nao tem o que
 * configurar: se nao estiver no ar, o `probe` diz.
 */
export function resolveEstimators(
  env: EstimatorEnvironment,
  options: ResolveEstimatorsOptions = {},
): ResolvedEstimators {
  const providers: ISystemOneProvider<RemoteEstimatorId>[] = [];
  const unavailable: UnavailableEstimator[] = [];

  const chave = env.TYPESAFE_API_KEY?.trim();
  if (chave) {
    providers.push(
      new SystemOneProvider({
        id: 'jev',
        baseUrl: env.JEV_URL?.trim() || JEV_DEFAULT_URL,
        model: env.JEV_MODEL?.trim() || JEV_DEFAULT_MODEL,
        apiKey: chave,
        timeoutMs: 20_000,
        fetch: options.fetch,
        onRawResponse: options.onRawResponse,
      }),
    );
  } else {
    unavailable.push({ estimator: 'jev', reason: 'TYPESAFE_API_KEY is not set (in .env or in the environment)' });
  }

  providers.push(
    new SystemOneProvider({
      id: 'laya',
      baseUrl: env.LAYA_URL?.trim() || LAYA_DEFAULT_URL,
      model: env.LAYA_MODEL?.trim() || undefined,
      apiKey: env.LAYA_API_KEY?.trim() || undefined,
      healthPath: '/health',
      extraBody: { max_len: inteiro(env.LAYA_MAX_LEN) ?? LAYA_DEFAULT_MAX_LEN },
      timeoutMs: 120_000,
      fetch: options.fetch,
      onRawResponse: options.onRawResponse,
    }),
  );

  return { providers, unavailable };
}

function inteiro(texto: string | undefined): number | undefined {
  const valor = Number(texto);
  return texto && Number.isInteger(valor) && valor > 0 ? valor : undefined;
}
