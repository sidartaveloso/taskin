import type { Task } from '@opentask/taskin-types';
import { type BaseDataset, type Brand, criarExecutorRinha, type Narrador } from '@rinhany/core';
import { competitorsFor } from '../competitors/competitors';
import type { IDifficultyCompetitor } from '../competitors/competitors.types';
import {
  DifficultyJudge,
  measureAnswer,
  measureCompetitor,
  RANKING_ACCURACY,
} from '../difficulty-judge/difficulty-judge';
import type { DifficultyResult } from '../difficulty-judge/difficulty-judge.types';
import { DIFFICULTY_QUESTION_VERSION, humanScore, taskForEstimate } from '../difficulty-question/difficulty-question';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { IEstimatorRouter } from '../estimator-router/estimator-router.types';
import { isRemoteEstimator, parseSuggestionSource } from '../estimators/estimators';
import type {
  AnswerKeyEntry,
  BestModel,
  CompetitorScore,
  IDifficultyBenchmark,
  Scoreboard,
} from './difficulty-benchmark.types';

/** O gabarito: toda task com nota humana na escala, de qualquer status. */
export function answerKeyFrom(tasks: readonly Task[]): AnswerKeyEntry[] {
  return tasks.flatMap((task) => {
    const difficulty = humanScore(task);
    return difficulty === undefined ? [] : [{ task: taskForEstimate(task), difficulty }];
  });
}

/** O gabarito vai nos metadados: o runner le, o competidor so recebe `dados`. */
type DatasetDaTask = BaseDataset<TaskForEstimate, { readonly expected: number }>;

export class DifficultyBenchmark implements IDifficultyBenchmark {
  constructor(
    private readonly router: IEstimatorRouter,
    private readonly competitors: (
      router: IEstimatorRouter,
      answerKey: readonly AnswerKeyEntry[],
    ) => IDifficultyCompetitor[] = competitorsFor,
  ) {}

  async run(
    answerKey: readonly AnswerKeyEntry[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<Scoreboard> {
    const competidores = this.competitors(this.router, answerKey);
    const datasets: DatasetDaTask[] = answerKey.map((entrada) => ({
      id: entrada.task.id as Brand<string, 'DatasetId'>,
      nome: `task-${entrada.task.id}`,
      dados: entrada.task,
      metadados: { expected: entrada.difficulty },
    }));

    const executor = criarExecutorRinha<DatasetDaTask, IDifficultyCompetitor, DifficultyResult, undefined>({
      nome: 'difficulty: jev x laya',
      datasets,
      algoritmos: competidores,
      runner: async (competidor, dataset) => {
        const expected = dataset.metadados?.expected;
        if (expected === undefined) throw new Error(`task-${dataset.id} has no human score`);
        const estimate = await competidor.estimate(dataset.dados);
        return {
          algoritmo_id: competidor.id,
          dataset_id: dataset.id,
          saida: estimate,
          metricas: measureAnswer(expected, estimate),
          tempo_execucao_ms: estimate.latencyMs,
          timestamp: new Date(),
        };
      },
      agregador: () => undefined,
      juiz: new DifficultyJudge(),
      narrador: narradorDeProgresso(onProgress),
    });

    const relatorio = await executor.executar();
    return placar(answerKey, competidores, relatorio.resultados, relatorio.comparacao.rankings);
  }
}

function placar(
  answerKey: readonly AnswerKeyEntry[],
  competidores: readonly IDifficultyCompetitor[],
  resultados: readonly DifficultyResult[],
  rankings: ReadonlyMap<string, readonly string[]>,
): Scoreboard {
  const acerto = rankings.get(RANKING_ACCURACY) ?? [];
  const notas: CompetitorScore[] = competidores.map((c) => {
    const { firstError, ...medidas } = measureCompetitor(resultados.filter((r) => r.algoritmo_id === c.id));
    return {
      competitor: c.id,
      kind: c.kind,
      ...medidas,
      ...(medidas.answered === 0 ? { didNotRun: firstError ?? 'did not answer' } : {}),
    };
  });
  const posicao = (id: string) => {
    const i = acerto.indexOf(id);
    return i < 0 ? Number.POSITIVE_INFINITY : i;
  };
  notas.sort((a, b) => posicao(a.competitor) - posicao(b.competitor));

  const walkovers = notas.flatMap((n) =>
    isRemoteEstimator(n.competitor) && n.didNotRun ? [{ estimator: n.competitor, reason: n.didNotRun }] : [],
  );

  return {
    schema: 2,
    questionVersion: DIFFICULTY_QUESTION_VERSION,
    generatedAt: new Date().toISOString(),
    answerKeySize: answerKey.length,
    competitors: notas,
    rankings: Object.fromEntries(rankings),
    winner: acerto[0],
    bestModel: melhorModelo(notas, acerto, walkovers.length > 0),
    walkovers,
    tasks: answerKey.map((entrada) => ({
      taskId: entrada.task.id,
      title: entrada.task.title,
      expected: entrada.difficulty,
      estimates: Object.fromEntries(
        competidores.map((c) => {
          const r = resultados.find((x) => x.algoritmo_id === c.id && x.dataset_id === entrada.task.id);
          return [c.id, r?.saida && !r.erro ? r.saida.difficulty : null];
        }),
      ),
    })),
  };
}

/** O modelo mais bem colocado no acerto, se W.O., e se ficou a frente de todos os pisos. */
/** O modelo (cru ou calibrado) mais bem colocado no acerto, se W.O., e se ficou a frente de todos os pisos. */
function melhorModelo(
  notas: readonly CompetitorScore[],
  acerto: readonly string[],
  byWalkover: boolean,
): BestModel | undefined {
  const melhor = notas.find((n) => n.kind === 'model' && !n.didNotRun);
  const source = melhor && parseSuggestionSource(melhor.competitor);
  if (!melhor || !source) return undefined;
  const pisoMaisBemColocado = acerto.findIndex((id) => notas.find((n) => n.competitor === id)?.kind === 'baseline');
  return {
    source: source.id,
    byWalkover,
    beatsBaselines: pisoMaisBemColocado < 0 || acerto.indexOf(melhor.competitor) < pisoMaisBemColocado,
  };
}

/** A rinha nao narra luta nenhuma: o `golpe`/`nocaute` do rinhany e por tempo, e aqui nao diz nada. */
function narradorDeProgresso(onProgress?: (done: number, total: number) => void): Narrador {
  const nada = () => {};
  return {
    onRinhaIniciar: nada,
    onRodadaIniciar: nada,
    onExecucaoIniciar: nada,
    onExecucaoFinalizar: nada,
    onRodadaFinalizar: (ctx) => onProgress?.(ctx.rodada, ctx.total_rodadas),
    onRinhaFinalizar: nada,
    onEventoLuta: nada,
  };
}
