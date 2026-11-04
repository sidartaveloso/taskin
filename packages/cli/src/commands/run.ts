/**
 * `taskin run` — despacha o plano nesta maquina: lanca em paralelo as
 * atribuicoes que caem aqui e ja podem comecar, ate a capacidade da maquina e
 * das contas, cada uma pelo `taskin access run` com a conta e o modelo que o
 * plano fixou. Cada execucao vai ao registro; quando uma termina, replaneja e
 * lanca a proxima. As atribuicoes de outras maquinas esperam o despacho remoto.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type Assignment,
  approveCommand,
  type CommandApproval,
  commandApproval,
  decideDispatch,
  dispatchPlan,
  instant,
  type PlanReport,
  type RunStarted,
  resourceId,
  runOutcomeFrom,
  taskRef,
} from '@opentask/taskin-situation';
import type { Command } from 'commander';
import { askApproval, askInTerminal } from '../lib/dispatch-approval.js';
import { type LocalPlanner, openLocalPlanner } from '../lib/local-plan.js';
import { THIS_MACHINE } from '../lib/probe-situation.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { noticeMe } from './viewpoints.js';

/** O marcador do modelo de comando que vira o id da task. */
export const TASK_PLACEHOLDER = '{task}';
export const TASK_ENV_VAR = 'TASKIN_TASK';
/** O arquivo em que o comando escreve o resultado da execucao, em JSON. */
export const RUN_RESULT_ENV_VAR = 'TASKIN_RUN_RESULT';
const SIGNALS: readonly NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];

interface RunOptions {
  dryRun?: boolean;
  allow?: boolean;
}

/** O modelo do comando em `resources.dispatch.command` do `.taskin.json`. */
export function dispatchCommandOf(repositoryConfig: string): string | undefined {
  if (!existsSync(repositoryConfig)) return undefined;
  const config = JSON.parse(readFileSync(repositoryConfig, 'utf8')) as {
    resources?: { dispatch?: { command?: unknown } };
  };
  const command = config.resources?.dispatch?.command;
  return typeof command === 'string' && command.trim() !== '' ? command : undefined;
}

/** O id da task no comando, citado para o shell se tiver algo alem de letras, numeros e `._-`. */
function shellWord(text: string): string {
  return /^[A-Za-z0-9._-]+$/.test(text) ? text : `'${text.replaceAll("'", `'\\''`)}'`;
}

function describe(report: PlanReport, a: Assignment, withMachine = false): string {
  const name = (id: string) => report.resources[id]?.name ?? id;
  const title = `#${a.task} ${report.titles[a.task] ?? ''}`.trimEnd();
  return `${title} → ${name(a.access)} (${a.model})${withMachine ? ` on ${name(a.machine)}` : ''}`;
}

function showDecision(report: PlanReport): void {
  const here = resourceId(THIS_MACHINE);
  const d = decideDispatch(report.plan, { machine: here, now: instant(Date.now()), running: [] });
  const name = report.resources[here]?.name ?? THIS_MACHINE;
  const lines = [`Dry run for ${report.repository}: nothing is launched.`, '', `Would launch now on ${name}:`];
  lines.push(...(d.launch.length === 0 ? ['  nothing'] : d.launch.map((a) => `  ${describe(report, a)}`)));
  if (d.later.length > 0) {
    lines.push('', `Later on ${name}:`);
    lines.push(...d.later.map((a) => `  ${describe(report, a)} at ${new Date(a.at).toISOString()}`));
  }
  if (d.remote.length > 0) {
    lines.push('', 'Waiting for remote dispatch:');
    lines.push(...d.remote.map((a) => `  ${describe(report, a, true)}`));
  }
  const deferred = deferredLines(report);
  if (deferred.length > 0) lines.push('', ...deferred);
  process.stdout.write(`${lines.join('\n')}\n`);
}

/** Por que uma task adiada nao sai, pelo codigo que o escalonador deu. */
const WHY_DEFERRED: Readonly<Record<string, string>> = {
  data: 'no account here is cleared for its sensitivity (the task field Sensitivity, or resources.defaultSensitivity)',
};

function deferredLines(report: PlanReport): string[] {
  if (report.deferred.length === 0) return [];
  return [
    'Deferred:',
    ...report.deferred.map((d) => {
      const why = WHY_DEFERRED[d.reason];
      return `  ${`#${d.task} ${report.titles[d.task] ?? ''}`.trimEnd()} — ${d.reason}${why ? `: ${why}` : ''}`;
    }),
  ];
}

interface Launching {
  readonly planner: LocalPlanner;
  readonly command: string;
  readonly report: () => PlanReport;
  readonly children: Set<ChildProcess>;
  readonly interrupted: () => boolean;
}

/** Roda uma atribuicao pelo `taskin access run` e fecha a execucao com o que o comando escreveu, ou abandonada. */
async function launch(ctx: Launching, a: Assignment): Promise<void> {
  const report = ctx.report();
  const { problem } = report.plan;
  const estimated = problem.tasks.find((t) => t.task === a.task)?.estimated;
  const sensitivity = problem.tasks.find((t) => t.task === a.task)?.sensitivity;
  const access = problem.accesses.find((x) => x.id === a.access);
  if (estimated === undefined || sensitivity === undefined || access === undefined) return;
  const { ledger, situation } = ctx.planner;

  const planned = await ledger.planRun(situation.repository, taskRef(String(a.task)), estimated);
  const run: RunStarted = await ledger.startRun(planned, a.access);
  const dir = mkdtempSync(join(tmpdir(), 'taskin-run-'));
  const result = join(dir, 'result.json');
  const task = String(a.task);
  console.error(`Launching ${describe(report, a, true)}`);

  const code = await new Promise<number | null>((resolve) => {
    const child = spawn(
      process.execPath,
      [
        process.argv[1] as string,
        'access',
        'run',
        String(access.kind),
        '--access',
        report.resources[a.access]?.name ?? String(a.access),
        '--model',
        a.model,
        '--sensitivity',
        sensitivity,
        '--task',
        task,
        '--',
        'sh',
        '-c',
        ctx.command.replaceAll(TASK_PLACEHOLDER, shellWord(task)),
      ],
      { stdio: 'inherit', env: { ...process.env, [TASK_ENV_VAR]: task, [RUN_RESULT_ENV_VAR]: result } },
    );
    ctx.children.add(child);
    child.on('error', (failure) => {
      console.error(`Could not run task ${task}: ${failure.message}`);
      ctx.children.delete(child);
      resolve(null);
    });
    child.on('exit', (exit) => {
      ctx.children.delete(child);
      resolve(exit);
    });
  });

  const outcome = ctx.interrupted()
    ? undefined
    : runOutcomeFrom(existsSync(result) ? readFileSync(result, 'utf8') : undefined, a.model);
  rmSync(dir, { recursive: true, force: true });
  if (outcome === undefined) {
    await ledger.abandonRun(run);
    console.error(`Task ${task} ended without a result (exit ${code ?? 'none'}): the run is recorded as abandoned.`);
    await warnMe(task, 'abandoned (no result)');
    return;
  }
  await ledger.finishRun(run, outcome);
  const ended = outcome.completed ? 'completed' : 'not completed';
  console.error(`Task ${task} ended: ${ended}.`);
  await warnMe(task, ended);
}

/** Avisa a pessoa pelos canais dela. Falha de aviso nunca muda a execucao nem o codigo de saida. */
async function warnMe(task: string, ended: string): Promise<void> {
  const { delivered, text } = await noticeMe(
    `Task ${task} ended: ${ended}`,
    `The run of task ${task} ended: ${ended}.`,
  );
  if (!delivered) console.error(`Notice for task ${task}: ${text}`);
}

/**
 * `--allow`: mostra o comando e pergunta. Sem terminal, nunca aprova, como o
 * `direnv allow`: o que esta rodando sozinho nao aprova o que vai receber o segredo.
 */
async function allowCommand(personalResources: string, repository: string, command: string): Promise<void> {
  if (commandApproval(personalResources, repository, command) === 'approved') {
    console.error('This command is already approved here.');
    return;
  }
  console.error(`Command in resources.dispatch.command:\n\n  ${command}\n`);
  const answer = await askApproval(Boolean(process.stdin.isTTY && process.stderr.isTTY), askInTerminal);
  if (answer === 'approved') {
    approveCommand(personalResources, repository, command);
    console.error('Approved in your personal resources.json. Now run: taskin run');
    return;
  }
  console.error(
    answer === 'no-terminal'
      ? 'Approving needs a person at a terminal: nothing was approved. Run taskin run --allow in a terminal.'
      : 'Not approved.',
  );
  process.exit(1);
}

/** Sem aprovacao, nada sai: mostra o comando e diz como aprovar. */
function requireApproval(approval: CommandApproval, command: string): void {
  if (approval === 'approved') return;
  const what =
    approval === 'changed'
      ? 'The command in resources.dispatch.command changed since you approved it.'
      : 'This repository declares a command in resources.dispatch.command that you have not approved.';
  console.error(
    `${what} It runs with the secret of your accounts in its environment:\n\n  ${command}\n\nNothing was launched. To approve it, in a terminal: taskin run --allow`,
  );
  process.exit(1);
}

async function runPlan(options: RunOptions): Promise<void> {
  requireTaskinProject();
  const root = process.cwd();
  const planner = await openLocalPlanner(root, (warning) => console.error(`Warning: ${warning}`));

  if (options.dryRun) {
    showDecision(await planner.plan());
    return;
  }

  const command = dispatchCommandOf(planner.situation.paths.repositoryConfig);
  if (command === undefined) {
    console.error(
      `Nothing to run each task with: declare resources.dispatch.command in .taskin.json, e.g. "my-agent --task ${TASK_PLACEHOLDER}".`,
    );
    process.exit(1);
  }

  const { personalResources } = planner.situation.paths;
  const repository = String(planner.situation.repository);
  if (options.allow) {
    await allowCommand(personalResources, repository, command);
    return;
  }
  requireApproval(commandApproval(personalResources, repository, command), command);

  const children = new Set<ChildProcess>();
  const stop = new AbortController();
  const onSignal = (signal: NodeJS.Signals) => {
    stop.abort();
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  };
  for (const signal of SIGNALS) process.on(signal, onSignal);

  let last: PlanReport | undefined;
  const ctx: Launching = {
    planner,
    command,
    children,
    report: () => last as PlanReport,
    interrupted: () => stop.signal.aborted,
  };
  try {
    const summary = await dispatchPlan({
      clock: { now: () => instant(Date.now()) },
      machine: resourceId(THIS_MACHINE),
      signal: stop.signal,
      plan: async (exclude) => {
        last = await planner.plan(exclude.map(String));
        return last.plan;
      },
      launch: (a) =>
        launch(ctx, a).catch((failure: Error) =>
          console.error(`Task ${a.task} could not be recorded: ${failure.message}`),
        ),
    });
    if (summary.launched.length === 0) console.error('Nothing can start on this machine now.');
    if (last !== undefined) for (const line of deferredLines(last)) console.error(line);
    if (last !== undefined && summary.remote.length > 0) {
      const report = last;
      console.error('Waiting for remote dispatch:');
      for (const a of summary.remote) console.error(`  ${describe(report, a, true)}`);
    }
  } finally {
    for (const signal of SIGNALS) process.off(signal, onSignal);
  }
  if (stop.signal.aborted) process.exit(130);
}

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description(
      '🚀 Dispatch the plan on this machine: run the tasks assigned here in parallel, each with the account and model the plan chose, through resources.dispatch.command',
    )
    .option('--dry-run', 'Show what would be launched now, by machine, account and model, without launching anything')
    .option('--allow', 'Show resources.dispatch.command and, in a terminal, approve it to run on your behalf')
    .action(async (options: RunOptions) => {
      await runPlan(options);
    });
}
