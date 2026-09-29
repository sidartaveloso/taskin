import { difficultyFromAnswer } from '../difficulty-question/difficulty-question';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import { REMOTE_ESTIMATORS } from '../estimators/estimators';
import type { RemoteEstimatorId, UnavailableEstimator } from '../estimators/estimators.types';
import type { EstimatorOutcome, IEstimatorRouter } from './estimator-router.types';

/** O que um modelo falso responde para uma task: um `score` de 0 a 4, ou uma falha. */
export type RespostaFalsa = number | { readonly falha: string };

/**
 * Para os testes da rinha e da sugestao: cada modelo responde por uma funcao,
 * e o mock guarda cada task que recebeu — para provar que a nota nao chega.
 */
export class EstimatorRouterMock implements IEstimatorRouter {
  readonly perguntas: TaskForEstimate[] = [];

  constructor(
    private readonly respostas: Partial<Record<RemoteEstimatorId, (task: TaskForEstimate) => RespostaFalsa>>,
    private readonly indisponiveis: readonly UnavailableEstimator[] = [],
  ) {}

  async probe(): Promise<void> {}

  unavailable(): readonly UnavailableEstimator[] {
    return this.indisponiveis;
  }

  async ask(task: TaskForEstimate): Promise<readonly EstimatorOutcome[]> {
    this.perguntas.push(task);
    return REMOTE_ESTIMATORS.map((estimator): EstimatorOutcome => {
      const fora = this.indisponiveis.find((u) => u.estimator === estimator);
      const responder = this.respostas[estimator];
      if (fora || !responder) {
        return { kind: 'unavailable', estimator, reason: fora?.reason ?? `${estimator} is not configured` };
      }
      const resposta = responder(task);
      if (typeof resposta !== 'number') return { kind: 'failed', estimator, reason: resposta.falha, latencyMs: 5 };
      return {
        kind: 'answered',
        estimator,
        estimate: difficultyFromAnswer({
          type: 'score',
          score: resposta,
          legend: {},
          probabilities: {},
          confidence: 0.5,
        }),
        latencyMs: estimator === 'jev' ? 200 : 40,
        inputTokens: 100,
        fromCache: false,
      };
    });
  }
}
