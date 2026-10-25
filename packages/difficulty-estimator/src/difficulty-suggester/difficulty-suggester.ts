import type { Task } from '@opentask/taskin-types';
import type { ICalibration } from '../calibration/calibration.types';
import type { Scoreboard } from '../difficulty-benchmark/difficulty-benchmark.types';
import { humanScore } from '../difficulty-question/difficulty-question';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { EstimatorOutcome, IEstimatorRouter } from '../estimator-router/estimator-router.types';
import { parseSuggestionSource, SUGGESTION_SOURCES } from '../estimators/estimators';
import type { SuggestionSource } from '../estimators/estimators.types';
import type { IDifficultySuggester, SourceChoice, Suggestion } from './difficulty-suggester.types';

const FECHADAS = new Set<string>(['done', 'canceled']);

/** Sem ids, a sugestao e para quem ainda vai ser feito e nao tem nota: task concluida nao ordena fila. */
export function unscoredOpenTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => humanScore(task) === undefined && !FECHADAS.has(task.status));
}

export class DifficultySuggester implements IDifficultySuggester {
  constructor(private readonly router: IEstimatorRouter) {}

  async suggest(
    tasks: readonly TaskForEstimate[],
    source?: SuggestionSource,
    calibration?: ICalibration,
  ): Promise<readonly Suggestion[]> {
    const sugestoes: Suggestion[] = [];
    for (const task of tasks) {
      const outcomes = await this.router.ask(task);
      const notas = outcomes.flatMap((o) => (o.kind === 'answered' ? [o.estimate.difficulty] : []));
      const nota = source && notaDaFonte(outcomes, source, calibration);
      sugestoes.push({
        task: { id: task.id, title: task.title },
        outcomes,
        ...(notas.length === outcomes.length && notas.length > 1 ? { agreement: new Set(notas).size === 1 } : {}),
        ...(source && nota !== undefined ? { chosen: { source: source.id, difficulty: nota } } : {}),
      });
    }
    return sugestoes;
  }
}

/** A nota do modelo da fonte; calibrada, e a nota humana da mesma posicao — e sem calibracao, nenhuma. */
function notaDaFonte(
  outcomes: readonly EstimatorOutcome[],
  source: SuggestionSource,
  calibration: ICalibration | undefined,
): number | undefined {
  const resultado = outcomes.find((o) => o.estimator === source.estimator);
  if (resultado?.kind !== 'answered') return undefined;
  if (!source.calibrated) return resultado.estimate.difficulty;
  return calibration?.difficultyFor(resultado.estimate.score);
}

const FONTES = SUGGESTION_SOURCES.join(', ');

/**
 * A nota que vale e a da fonte que a pessoa escolheu (`--by`), ou a do modelo
 * — cru ou calibrado — que venceu a ultima rinha, desde que tenha ficado a
 * frente dos pisos. Sem rinha, ou com um vencedor que nao bate o `always-2`,
 * ninguem e escolhido por padrao: sugestao de quem nao prova que presta nao
 * vira nota.
 */
export function chooseSource(scoreboard: Scoreboard | undefined, by?: SuggestionSource): SourceChoice {
  if (by) return { kind: 'chosen', source: by, why: `chosen with --by ${by.id}` };
  if (!scoreboard) {
    return { kind: 'none', why: `no rinha yet: run \`taskin estimate --rinha\`, or choose one with --by (${FONTES})` };
  }
  const melhor = scoreboard.bestModel;
  const source = melhor && parseSuggestionSource(melhor.source);
  if (!melhor || !source) {
    return { kind: 'none', why: `no model answered in the last rinha; choose one with --by (${FONTES})` };
  }
  if (!melhor.beatsBaselines) {
    return {
      kind: 'none',
      why: `${source.id} did not beat the baselines in the last rinha; choose with --by to apply anyway`,
    };
  }
  const wo = melhor.byWalkover ? ' (by walkover)' : '';
  return { kind: 'chosen', source, why: `${source.id} won the last rinha${wo}` };
}
