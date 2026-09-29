/**
 * `taskin estimate` — o Jev e o Laya sugerem a dificuldade, e a rinha contra
 * as notas humanas diz em quem confiar (task-141).
 */

import path from 'node:path';
import {
  answerKeyFrom,
  type CompetitorScore,
  calibrationPairs,
  chooseSource,
  DifficultyBenchmark,
  DifficultySuggester,
  type EstimatorOutcome,
  EstimatorRouter,
  humanScore,
  type ICalibration,
  MIN_CALIBRATION_PAIRS,
  parseSuggestionSource,
  QuantileCalibration,
  type RemoteEstimatorId,
  RinhaStoreFs,
  resolveEstimators,
  type Scoreboard,
  SharedAsk,
  SUGGESTION_SOURCES,
  type Suggestion,
  type SuggestionSource,
  taskForEstimate,
  type UnavailableEstimator,
  unscoredOpenTasks,
} from '@opentask/taskin-difficulty-estimator';
import { type Task, TaskManager } from '@opentask/taskin-task-manager';
import { colors, error, info, printHeader, success, warning } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { normalizeTaskId } from '../lib/task-id.js';
import { defineCommand } from './define-command/index.js';

interface EstimateOptions {
  rinha?: boolean;
  apply?: boolean;
  by?: string;
  /** Commander poe `false` com `--no-cache`. */
  cache?: boolean;
}

/** Onde a rinha guarda placares, cache e respostas cruas, fora do git. */
export const RINHA_DIR = path.join('.taskin', 'rinhas');

export const estimateCommand = defineCommand({
  name: 'estimate [task-ids...]',
  description: '🥊 Suggest how hard tasks are, asking Jev and Laya — or run the rinha against the human scores',
  options: [
    {
      flags: '--rinha',
      description:
        '(beta) Benchmark Jev and Laya against every task that already has a difficulty — a hint, not the truth',
    },
    { flags: '--apply', description: 'Write the suggestion to the tasks that have no difficulty yet' },
    {
      flags: '--by <source>',
      description: `Whose suggestion counts: ${SUGGESTION_SOURCES.join(', ')} (default: the last rinha winner)`,
    },
    { flags: '--no-cache', description: 'Ask again even when an answer is stored' },
  ],
  handler: async (ids: string[], options: EstimateOptions) => {
    await estimar(ids, options);
  },
});

async function estimar(ids: string[], options: EstimateOptions): Promise<void> {
  requireTaskinProject();
  const by = lerFonte(options.by);
  if (options.rinha && (ids.length > 0 || options.apply)) {
    falhar('--rinha runs against every task a human scored: it takes no task ids and no --apply.');
  }

  const raiz = process.cwd();
  const store = new RinhaStoreFs(path.join(raiz, RINHA_DIR));
  // O `.env` do projeto ja esta no `process.env`: o `loadDotEnv` da partida da CLI
  // o carrega sem passar por cima do que o shell exporta.
  const estimadores = resolveEstimators(process.env, {
    onRawResponse: (raw) => {
      store.writeRawResponse(raw).catch(() => undefined);
    },
  });
  const router = new EstimatorRouter(estimadores, store, { useCache: options.cache !== false });
  await router.probe();

  const { provider } = await resolveTaskProvider();
  const manager = new TaskManager(provider);
  const tasks = await manager.getAllTasks();

  if (options.rinha) await rinha(tasks, router, store, raiz);
  else await sugerir(ids, tasks, router, store, manager, by, options.apply === true);
}

async function rinha(tasks: Task[], router: EstimatorRouter, store: RinhaStoreFs, raiz: string): Promise<void> {
  const gabarito = answerKeyFrom(tasks);
  if (gabarito.length === 0) {
    falhar('No task has a difficulty yet. Score a few with `taskin difficulty`: they are the answer key.');
  }

  printHeader(`Rinha (beta): Jev x Laya against ${gabarito.length} human scores`, '🥊');
  for (const fora of router.unavailable()) warning(avisoDeFora(fora));

  const placar = await new DifficultyBenchmark(router).run(gabarito, progresso);
  limparProgresso();

  imprimirPlacar(placar);
  const onde = await store.saveScoreboard(placar);
  info(`Scoreboard saved to ${path.relative(raiz, onde)}`);
  warning(avisoDeBeta(gabarito.length));
}

function imprimirPlacar(placar: Scoreboard): void {
  const linhas = placar.competitors.map((c, i) =>
    c.didNotRun
      ? ['-', c.competitor, `did not run: ${c.didNotRun}`]
      : [
          String(i + 1),
          c.competitor,
          `${c.answered}/${placar.answerKeySize}`,
          c.meanAbsoluteError.toFixed(2),
          pct(c.exactRate),
          pct(c.withinOneRate),
          c.brier === undefined ? '—' : c.brier.toFixed(2),
          c.meanLatencyMs.toFixed(0),
        ],
  );
  tabela(['#', 'competitor', 'answered', 'mean error', 'exact', '±1', 'brier', 'ms'], linhas);
  console.log();

  const melhor = placar.bestModel;
  if (!melhor) {
    warning('Neither Jev nor Laya answered: a baseline won, and there is nothing to suggest with.');
    return;
  }
  const wo = melhor.byWalkover
    ? ` — by walkover (${placar.walkovers.map((w) => w.estimator).join(', ')} did not run)`
    : '';
  success(`${melhor.source} is the best model${wo}.`);
  if (melhor.beatsBaselines) {
    info(`It beats the baselines: \`taskin estimate --apply\` will write its suggestions.`);
  } else {
    const piso = melhorPiso(placar.competitors);
    warning(
      `But it does not beat the baselines${piso ? ` (${piso} errs less)` : ''}: its suggestions are not applied unless you pass --by.`,
    );
  }
}

async function sugerir(
  ids: string[],
  tasks: Task[],
  router: EstimatorRouter,
  store: RinhaStoreFs,
  manager: TaskManager,
  by: SuggestionSource | undefined,
  aplicar: boolean,
): Promise<void> {
  const alvos = ids.length > 0 ? ids.map((id) => acharTask(tasks, id)) : unscoredOpenTasks(tasks);
  if (alvos.length === 0) {
    info('Every open task already has a difficulty. Pass task ids to ask anyway.');
    return;
  }

  const fora = router.unavailable();
  if (fora.length === 2 && fora.every((f) => !f.cacheOnly)) falharSemNinguem(fora);

  const escolha = chooseSource(await store.latestScoreboard(), by);
  const fonte = escolha.kind === 'chosen' ? escolha.source : undefined;
  const calibracao = fonte?.calibrated ? await calibrar(tasks, router, fonte.estimator) : undefined;
  const sugestoes = await new DifficultySuggester(router).suggest(alvos.map(taskForEstimate), fonte, calibracao);

  const alguemRespondeu = sugestoes.some((s) => s.outcomes.some((o) => o.kind === 'answered'));
  if (!alguemRespondeu && fora.length === 2) falharSemNinguem(fora);

  imprimirSugestoes(sugestoes);
  for (const f of fora) console.log(colors.secondary(`  ${avisoDeFora(f)}`));
  for (const falha of falhas(sugestoes)) console.log(colors.secondary(`  ${falha}`));
  console.log();

  if (escolha.kind === 'none') {
    warning(`No suggestion counts yet: ${escolha.why}.`);
    if (aplicar) falhar('Nothing applied.');
    return;
  }
  info(`Suggestion from ${escolha.why}.`);
  if (!by) warning('The rinha is beta: its winner is a hint, not the truth. Review before applying.');
  if (calibracao) info(`Calibrated on the ${calibracao.size} tasks a human scored.`);
  if (!aplicar) {
    info('Nothing written. Run again with --apply to write these suggestions.');
    return;
  }

  let aplicadas = 0;
  for (const s of sugestoes) {
    if (!s.chosen) continue;
    const task = tasks.find((t) => t.id === s.task.id);
    if (!task) continue;
    const nota = humanScore(task);
    if (nota !== undefined) {
      warning(`task-${task.id} already has difficulty ${nota}, from a human: not overwritten.`);
      continue;
    }
    await manager.setDifficulty(task.id, s.chosen.difficulty);
    success(`task-${s.task.id} now has difficulty ${s.chosen.difficulty} (${s.chosen.source}).`);
    aplicadas++;
  }
  info(`${aplicadas} of ${sugestoes.length} task(s) scored.`);
}

function imprimirSugestoes(sugestoes: readonly Suggestion[]): void {
  const linhas = sugestoes.map((s) => {
    const [jev, laya] = s.outcomes;
    return [
      s.task.id,
      encurtar(s.task.title, 48),
      celula(jev),
      celula(laya),
      s.agreement === undefined ? '—' : s.agreement ? 'yes' : 'no',
      s.chosen ? `${s.chosen.difficulty} (${s.chosen.source})` : '—',
    ];
  });
  console.log();
  tabela(['task', 'title', 'jev', 'laya', 'agree', 'suggestion'], linhas);
}

/**
 * A rinha e beta: mede poucos pontos de nota humana, e o placar muda com cada
 * nota nova. Serve de pista para quem prioriza, nao de verdade — e o `--apply`
 * herda isso.
 */
export function avisoDeBeta(notas: number): string {
  return `Beta: this scoreboard comes from ${notas} human score(s) and changes with every new one. It is a hint, not the truth — review the suggestions before applying them.`;
}

/** Fora do ar ainda responde o que esta no cache; sem configuracao, nao roda. */
function avisoDeFora(fora: UnavailableEstimator): string {
  return fora.cacheOnly
    ? `${fora.estimator} is down, so only its cached answers count: ${fora.reason}`
    : `${fora.estimator} will not run: ${fora.reason}`;
}

function falharSemNinguem(fora: readonly UnavailableEstimator[]): never {
  falhar(`Neither Jev nor Laya can answer:\n${fora.map((f) => `  ${f.estimator}: ${f.reason}`).join('\n')}`);
}

function celula(o: EstimatorOutcome | undefined): string {
  if (!o || o.kind === 'unavailable') return '—';
  if (o.kind === 'failed') return 'failed';
  const confianca = o.estimate.confidence === undefined ? '' : ` ${pct(o.estimate.confidence)}`;
  return `${o.estimate.difficulty}${confianca}`;
}

function falhas(sugestoes: readonly Suggestion[]): string[] {
  const vistas = new Set<string>();
  for (const s of sugestoes) {
    for (const o of s.outcomes)
      if (o.kind === 'failed') vistas.add(`${o.estimator} failed on task-${s.task.id}: ${o.reason}`);
  }
  return [...vistas];
}

function melhorPiso(competidores: readonly CompetitorScore[]): string | undefined {
  return competidores.find((c) => c.kind === 'baseline' && !c.didNotRun)?.competitor;
}

function acharTask(tasks: Task[], texto: string): Task {
  const id = normalizeTaskId(texto);
  const task = id ? tasks.find((t) => t.id === id) : undefined;
  if (!task) falhar(`Task '${texto}' not found.`);
  return task;
}

function lerFonte(texto: string | undefined): SuggestionSource | undefined {
  if (texto === undefined) return undefined;
  const fonte = parseSuggestionSource(texto);
  if (fonte) return fonte;
  falhar(`Unknown source '${texto}'. Use --by with one of: ${SUGGESTION_SOURCES.join(', ')}.`);
}

/**
 * A calibracao de uma sugestao aprende com todas as notas humanas — a task
 * sugerida nao tem nota, entao nao ha o que deixar de fora. As respostas do
 * gabarito costumam vir do cache da ultima rinha.
 */
async function calibrar(tasks: Task[], router: EstimatorRouter, estimator: RemoteEstimatorId): Promise<ICalibration> {
  const pares = await calibrationPairs(answerKeyFrom(tasks), estimator, new SharedAsk(router));
  if (pares.length < MIN_CALIBRATION_PAIRS) {
    falhar(
      `Cannot calibrate ${estimator}: it answered ${pares.length} of the tasks a human scored, and calibrating needs ${MIN_CALIBRATION_PAIRS}.`,
    );
  }
  return new QuantileCalibration(pares);
}

function tabela(cabecalho: string[], linhas: string[][]): void {
  const larguras = cabecalho.map((titulo, i) =>
    Math.max(titulo.length, ...linhas.filter((l) => l.length === cabecalho.length).map((l) => (l[i] ?? '').length)),
  );
  const formatar = (celulas: string[]) =>
    celulas.length === cabecalho.length
      ? celulas.map((c, i) => c.padEnd(larguras[i] ?? 0)).join('  ')
      : celulas.map((c, i) => (i < celulas.length - 1 ? c.padEnd(larguras[i] ?? 0) : c)).join('  ');
  console.log(colors.secondary(`  ${formatar(cabecalho)}`));
  for (const linha of linhas) console.log(`  ${formatar(linha)}`);
}

function progresso(feitas: number, total: number): void {
  if (process.stderr.isTTY) process.stderr.write(`\r  ${feitas}/${total} tasks`);
}

function limparProgresso(): void {
  if (process.stderr.isTTY) process.stderr.write('\r\x1b[K');
}

const pct = (razao: number) => `${Math.round(razao * 100)}%`;

const encurtar = (texto: string, max: number) => (texto.length <= max ? texto : `${texto.slice(0, max - 1)}…`);

function falhar(mensagem: string): never {
  error(mensagem);
  process.exit(1);
}
