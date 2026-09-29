import type { Task } from '@opentask/taskin-types';
import type { Scoreboard } from '../difficulty-benchmark/difficulty-benchmark.types';
import { humanScore } from '../difficulty-question/difficulty-question';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { IEstimatorRouter } from '../estimator-router/estimator-router.types';
import type { RemoteEstimatorId } from '../estimators/estimators.types';
import type { EstimatorChoice, IDifficultySuggester, Suggestion } from './difficulty-suggester.types';

const FECHADAS = new Set<string>(['done', 'canceled']);

/** Sem ids, a sugestao e para quem ainda vai ser feito e nao tem nota: task concluida nao ordena fila. */
export function unscoredOpenTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => humanScore(task) === undefined && !FECHADAS.has(task.status));
}

export class DifficultySuggester implements IDifficultySuggester {
  constructor(private readonly router: IEstimatorRouter) {}

  async suggest(tasks: readonly TaskForEstimate[], by?: RemoteEstimatorId): Promise<readonly Suggestion[]> {
    const sugestoes: Suggestion[] = [];
    for (const task of tasks) {
      const outcomes = await this.router.ask(task);
      const notas = outcomes.flatMap((o) => (o.kind === 'answered' ? [o.estimate.difficulty] : []));
      const escolhido = outcomes.find((o) => o.estimator === by);
      sugestoes.push({
        task: { id: task.id, title: task.title },
        outcomes,
        ...(notas.length === outcomes.length && notas.length > 1 ? { agreement: new Set(notas).size === 1 } : {}),
        ...(escolhido?.kind === 'answered'
          ? { chosen: { estimator: escolhido.estimator, difficulty: escolhido.estimate.difficulty } }
          : {}),
      });
    }
    return sugestoes;
  }
}

/**
 * A nota que vale e a de quem a pessoa escolheu (`--by`), ou a do modelo que
 * venceu a ultima rinha — desde que ele tenha ficado a frente dos pisos. Sem
 * rinha, ou com um vencedor que nao bate o `always-2`, ninguem e escolhido
 * por padrao: sugestao de quem nao prova que presta nao vira nota.
 */
export function chooseEstimator(scoreboard: Scoreboard | undefined, by?: RemoteEstimatorId): EstimatorChoice {
  if (by) return { kind: 'chosen', estimator: by, why: `chosen with --by ${by}` };
  if (!scoreboard) {
    return { kind: 'none', why: 'no rinha yet: run `taskin estimate --rinha`, or choose with --by jev|laya' };
  }
  const melhor = scoreboard.bestModel;
  if (!melhor) {
    return { kind: 'none', why: 'no model answered in the last rinha; choose with --by jev|laya' };
  }
  if (!melhor.beatsBaselines) {
    return {
      kind: 'none',
      why: `${melhor.estimator} did not beat the baselines in the last rinha; choose with --by to apply anyway`,
    };
  }
  const wo = melhor.byWalkover ? ' (by walkover)' : '';
  return { kind: 'chosen', estimator: melhor.estimator, why: `${melhor.estimator} won the last rinha${wo}` };
}
