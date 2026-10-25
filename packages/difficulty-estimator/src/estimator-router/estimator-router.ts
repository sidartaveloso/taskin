import { createHash } from 'node:crypto';
import { type FanOutEntry, isFanOutResult, type Provider, Router } from '@layerall/core';
import {
  buildDifficultyRequest,
  DIFFICULTY_QUESTION_ID,
  DIFFICULTY_QUESTION_VERSION,
  difficultyFromAnswer,
} from '../difficulty-question/difficulty-question';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import { REMOTE_ESTIMATORS } from '../estimators/estimators';
import type { RemoteEstimatorId, ResolvedEstimators, UnavailableEstimator } from '../estimators/estimators.types';
import type { IRinhaStore } from '../rinha-store/rinha-store.types';
import type { ISystemOneProvider, SystemOneRequest, SystemOneResponse } from '../system-one/system-one.types';
import type { EstimatorOutcome, EstimatorRouterOptions, IEstimatorRouter } from './estimator-router.types';

export const DIFFICULTY_OPERATION = 'difficulty';

/** A chave muda com a versao da pergunta, com o texto da task e com o que o provider manda a mais. */
export function answerCacheKey(provider: ISystemOneProvider, request: SystemOneRequest): string {
  return createHash('sha256')
    .update(JSON.stringify({ question: DIFFICULTY_QUESTION_VERSION, provider: provider.cacheIdentity, request }))
    .digest('hex');
}

/**
 * O layerall na frente do Jev e do Laya: uma chamada `fan_out` por task, so
 * com quem nao tem a resposta guardada. O Router devolve um resultado por
 * provider e nunca junta os dois; juntar e decidir e de quem pergunta.
 */
export class EstimatorRouter implements IEstimatorRouter {
  /** Sem configuracao (o Jev sem chave): nao ha provider, nem cache a consultar. */
  private readonly semConfiguracao: Map<RemoteEstimatorId, string>;
  /** Configurado, mas o `probe` nao achou: responde so pelo cache. */
  private readonly foraDoAr = new Map<RemoteEstimatorId, string>();

  constructor(
    private readonly estimators: ResolvedEstimators,
    private readonly store: IRinhaStore,
    private readonly options: EstimatorRouterOptions = {},
  ) {
    this.semConfiguracao = new Map(estimators.unavailable.map((u) => [u.estimator, u.reason]));
  }

  async probe(): Promise<void> {
    await Promise.all(
      this.estimators.providers.map(async (provider) => {
        const saude = await provider.probe();
        if (!saude.ok) this.foraDoAr.set(provider.id, saude.reason);
      }),
    );
  }

  unavailable(): readonly UnavailableEstimator[] {
    return REMOTE_ESTIMATORS.flatMap((estimator): UnavailableEstimator[] => {
      const semConfiguracao = this.semConfiguracao.get(estimator);
      if (semConfiguracao) return [{ estimator, reason: semConfiguracao }];
      const foraDoAr = this.foraDoAr.get(estimator);
      return foraDoAr ? [{ estimator, reason: foraDoAr, cacheOnly: true }] : [];
    });
  }

  async ask(task: TaskForEstimate): Promise<readonly EstimatorOutcome[]> {
    const request = buildDifficultyRequest(task);
    const resultados = new Map<string, EstimatorOutcome>();
    const pendentes: ISystemOneProvider<RemoteEstimatorId>[] = [];

    for (const provider of this.estimators.providers) {
      const guardada =
        this.options.useCache === false ? undefined : await this.store.readAnswer(answerCacheKey(provider, request));
      const resultado = guardada && respondido(provider, guardada.response, guardada.latencyMs, true);
      if (resultado?.kind === 'answered') resultados.set(provider.id, resultado);
      else if (!this.foraDoAr.has(provider.id)) pendentes.push(provider);
    }

    if (pendentes.length > 0) {
      for (const entry of await this.fanOut(task, request, pendentes)) {
        const provider = pendentes.find((p) => p.id === entry.provider);
        if (!provider) continue;
        const resultado =
          entry.status === 'succeeded' && entry.result
            ? respondido(provider, entry.result, entry.latencyMs, false)
            : falhou(provider, entry.error?.message ?? `${provider.id} failed`, entry.latencyMs);
        if (resultado.kind === 'answered' && entry.result) {
          await this.store.writeAnswer(answerCacheKey(provider, request), {
            response: entry.result,
            latencyMs: entry.latencyMs,
          });
        }
        resultados.set(provider.id, resultado);
      }
    }

    return REMOTE_ESTIMATORS.map(
      (estimator): EstimatorOutcome =>
        resultados.get(estimator) ?? {
          kind: 'unavailable',
          estimator,
          reason:
            this.foraDoAr.get(estimator) ?? this.semConfiguracao.get(estimator) ?? `${estimator} is not configured`,
        },
    );
  }

  private async fanOut(
    task: TaskForEstimate,
    request: SystemOneRequest,
    providers: readonly ISystemOneProvider<RemoteEstimatorId>[],
  ): Promise<FanOutEntry<SystemOneResponse>[]> {
    const registrados: Record<string, Provider> = Object.fromEntries(providers.map((p) => [p.id, p]));
    const router = new Router({
      policy: {
        tenants: {
          default: {
            providers: providers.map((p) => p.id),
            operations: { [DIFFICULTY_OPERATION]: { strategy: 'fan_out' } },
          },
        },
      },
      providers: registrados,
    });
    const resultado = await router.execute<SystemOneRequest, SystemOneResponse>(
      DIFFICULTY_OPERATION,
      { externalId: `task-${task.id}`, data: request },
      { strategy: 'fan_out' },
    );
    return isFanOutResult(resultado) ? resultado.results : [];
  }
}

function respondido(
  provider: ISystemOneProvider<RemoteEstimatorId>,
  response: SystemOneResponse,
  latencyMs: number,
  fromCache: boolean,
): EstimatorOutcome {
  const answer = response.answers[DIFFICULTY_QUESTION_ID];
  if (!answer)
    return falhou(provider, `${provider.id} answered without the "${DIFFICULTY_QUESTION_ID}" question`, latencyMs);
  return {
    kind: 'answered',
    estimator: provider.id,
    estimate: difficultyFromAnswer(answer),
    latencyMs,
    inputTokens: response.usage?.input_tokens ?? 0,
    fromCache,
  };
}

function falhou(provider: ISystemOneProvider<RemoteEstimatorId>, reason: string, latencyMs: number): EstimatorOutcome {
  return { kind: 'failed', estimator: provider.id, reason, latencyMs };
}
