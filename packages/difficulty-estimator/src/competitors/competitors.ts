import { DIFICULDADE_MAXIMA, DIFICULDADE_MINIMA, validarDificuldade } from '@opentask/taskin-task-manager';
import { calibrationPairs, MIN_CALIBRATION_PAIRS, QuantileCalibration } from '../calibration/calibration';
import type { AnswerKeyEntry } from '../difficulty-benchmark/difficulty-benchmark.types';
import { DIFFICULTY_QUESTION_VERSION } from '../difficulty-question/difficulty-question';
import type { TaskForEstimate } from '../difficulty-question/difficulty-question.types';
import type { EstimatorOutcome, IEstimatorRouter } from '../estimator-router/estimator-router.types';
import type { RemoteEstimatorId } from '../estimators/estimators.types';
import type {
  CompetitorConfig,
  CompetitorEstimate,
  CompetitorId,
  IDifficultyCompetitor,
  ISharedAsk,
} from './competitors.types';

/** O competidor nao respondeu esta task; a mensagem e o motivo, que vai para o placar. */
export class CompetitorDidNotAnswer extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'CompetitorDidNotAnswer';
  }
}

export class SharedAsk implements ISharedAsk {
  private readonly perguntas = new Map<string, Promise<readonly EstimatorOutcome[]>>();

  constructor(private readonly router: IEstimatorRouter) {}

  async outcome(task: TaskForEstimate, estimator: RemoteEstimatorId): Promise<EstimatorOutcome> {
    let pergunta = this.perguntas.get(task.id);
    if (!pergunta) {
      pergunta = this.router.ask(task);
      this.perguntas.set(task.id, pergunta);
    }
    const resultado = (await pergunta).find((o) => o.estimator === estimator);
    if (!resultado) throw new CompetitorDidNotAnswer(`${estimator} gave no outcome`);
    return resultado;
  }
}

/** O Jev ou o Laya, pela pergunta dividida. */
export class ModelCompetitor implements IDifficultyCompetitor {
  readonly kind = 'model' as const;
  readonly id: CompetitorId;
  readonly nome: string;
  readonly descricao: string;
  readonly versao = `q${DIFFICULTY_QUESTION_VERSION}`;
  readonly configuracao: CompetitorConfig;

  constructor(
    readonly estimator: RemoteEstimatorId,
    private readonly ask: ISharedAsk,
  ) {
    this.id = estimator as CompetitorId;
    this.nome = estimator;
    this.descricao = `${estimator}, asked through layerall`;
    this.configuracao = { kind: 'model', estimator };
  }

  async estimate(task: TaskForEstimate): Promise<CompetitorEstimate> {
    const resultado = await this.ask.outcome(task, this.estimator);
    if (resultado.kind !== 'answered') throw new CompetitorDidNotAnswer(resultado.reason);
    return {
      difficulty: resultado.estimate.difficulty,
      confidence: resultado.estimate.confidence,
      latencyMs: resultado.latencyMs,
      inputTokens: resultado.inputTokens,
    };
  }
}

/**
 * O modelo com a nota lida pela posicao: o `score` dele, entre os que deu as
 * outras tasks do gabarito, vira a nota humana da mesma altura. A calibracao
 * de cada task e aprendida sem ela (leave-one-out): o competidor ve as notas
 * das outras, nunca a da task que esta respondendo.
 */
export class CalibratedCompetitor implements IDifficultyCompetitor {
  readonly kind = 'model' as const;
  readonly id: CompetitorId;
  readonly nome: string;
  readonly descricao: string;
  readonly versao = `q${DIFFICULTY_QUESTION_VERSION}+quantile`;
  readonly configuracao: CompetitorConfig;

  constructor(
    readonly estimator: RemoteEstimatorId,
    private readonly ask: ISharedAsk,
    private readonly answerKey: readonly AnswerKeyEntry[],
  ) {
    this.id = `${estimator}-calibrated` as CompetitorId;
    this.nome = `${estimator}-calibrated`;
    this.descricao = `${estimator}, read by position against the other human scores`;
    this.configuracao = { kind: 'calibrated', estimator, method: 'quantile, leave-one-out' };
  }

  async estimate(task: TaskForEstimate): Promise<CompetitorEstimate> {
    const resultado = await this.ask.outcome(task, this.estimator);
    if (resultado.kind !== 'answered') {
      throw new CompetitorDidNotAnswer(`${this.estimator} did not answer: ${resultado.reason}`);
    }
    const outras = this.answerKey.filter((entrada) => entrada.task.id !== task.id);
    const pares = await calibrationPairs(outras, this.estimator, this.ask);
    if (pares.length < MIN_CALIBRATION_PAIRS) {
      throw new CompetitorDidNotAnswer(
        `${this.estimator} answered ${pares.length} other scored task(s); calibrating needs ${MIN_CALIBRATION_PAIRS}`,
      );
    }
    return {
      difficulty: new QuantileCalibration(pares).difficultyFor(resultado.estimate.score),
      latencyMs: resultado.latencyMs,
      inputTokens: 0,
    };
  }
}

/**
 * Sempre a mesma nota. Com a moda do gabarito (2), acerta perto de metade sem
 * ler nada: modelo que nao bate isto nao merece sugerir.
 */
export class ConstantBaseline implements IDifficultyCompetitor {
  readonly kind = 'baseline' as const;
  readonly id: CompetitorId;
  readonly nome: string;
  readonly descricao: string;
  readonly versao = '1';
  readonly configuracao: CompetitorConfig;

  constructor(private readonly difficulty = 2) {
    validarDificuldade(difficulty);
    this.id = `always-${difficulty}` as CompetitorId;
    this.nome = `always-${difficulty}`;
    this.descricao = `answers ${difficulty} for every task`;
    this.configuracao = { kind: 'baseline', rule: this.descricao };
  }

  async estimate(): Promise<CompetitorEstimate> {
    return { difficulty: this.difficulty, latencyMs: 0, inputTokens: 0 };
  }
}

const TASKS_HEADING = /^##\s+(?:tasks|tarefas)\s*$/i;
const ITEM = /^\s*[-*]\s+\S/;
/** Limites de itens em `## Tasks` para cada nota; sem itens, o tamanho do texto decide. */
const ITENS_ATE = [1, 3, 6, 10];
const CARACTERES_ATE = [300, 800, 1500, 3000];

/** Conta os itens de `## Tasks`; sem essa secao, mede o tamanho do texto. Nao le o gabarito. */
export class HeuristicBaseline implements IDifficultyCompetitor {
  readonly kind = 'baseline' as const;
  readonly id = 'heuristic' as CompetitorId;
  readonly nome = 'heuristic';
  readonly descricao = 'counts the items under ## Tasks, or measures the text when there are none';
  readonly versao = '1';
  readonly configuracao: CompetitorConfig = { kind: 'baseline', rule: this.descricao };

  async estimate(task: TaskForEstimate): Promise<CompetitorEstimate> {
    return { difficulty: heuristicDifficulty(task.markdown), latencyMs: 0, inputTokens: 0 };
  }
}

export function heuristicDifficulty(markdown: string): number {
  const itens = itensDeTasks(markdown);
  const degrau =
    itens > 0 ? ITENS_ATE.findIndex((ate) => itens <= ate) : CARACTERES_ATE.findIndex((ate) => markdown.length <= ate);
  const nivel = degrau < 0 ? DIFICULDADE_MAXIMA : DIFICULDADE_MINIMA + degrau;
  return validarDificuldade(nivel);
}

function itensDeTasks(markdown: string): number {
  let dentro = false;
  let itens = 0;
  for (const linha of markdown.split('\n')) {
    if (linha.startsWith('## ')) dentro = TASKS_HEADING.test(linha.trim());
    else if (dentro && ITEM.test(linha)) itens++;
  }
  return itens;
}

/**
 * Os da rinha: os dois modelos, pela mesma pergunta; os dois calibrados pelo
 * gabarito — os dois, para a calibracao nao pender para um lado —; e os pisos.
 */
export function competitorsFor(
  router: IEstimatorRouter,
  answerKey: readonly AnswerKeyEntry[] = [],
): IDifficultyCompetitor[] {
  const ask = new SharedAsk(router);
  return [
    new ModelCompetitor('jev', ask),
    new ModelCompetitor('laya', ask),
    new CalibratedCompetitor('jev', ask, answerKey),
    new CalibratedCompetitor('laya', ask, answerKey),
    new ConstantBaseline(2),
    new HeuristicBaseline(),
  ];
}
