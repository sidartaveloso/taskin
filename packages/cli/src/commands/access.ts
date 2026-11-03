/**
 * `taskin access` — os acessos desta maquina: `run` escolhe uma conta (ou usa
 * a que o plano fixou, com `--access`, e o modelo dele em `TASKIN_MODEL`), roda o
 * comando com o segredo so no ambiente dele e, se a conta declara capacidade,
 * reserva uma vaga e a devolve no fim; `status` mostra as reservas em aberto,
 * sem segredo.
 */

import { spawn } from 'node:child_process';
import { constants, homedir } from 'node:os';
import { join } from 'node:path';
import {
  type AccessBrokerPorts,
  accessKind,
  createEnvSecretStore,
  createLocalAccessBroker,
  createLocalRunLedger,
  type DataClass,
  type IAccessBroker,
  instant,
  resourceId,
  taskinStateDir,
  taskRef,
} from '@opentask/taskin-situation';
import type { Command } from 'commander';
import { openLocalInventory } from '../lib/probe-situation.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { runLedgerFiles } from '../lib/run-ledger-files.js';

const SENSITIVITIES: readonly DataClass[] = ['public', 'internal', 'sensitive'];
/** O prazo de uma reserva: se o processo morre sem devolver, a vaga volta sozinha depois disto. */
const LEASE_TTL_MS = 60 * 60 * 1000;
const FACT_TTL_MS = 24 * 60 * 60 * 1000;
const FORWARDED_SIGNALS: readonly NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];

/** O `leases.json` no diretorio de estado desta maquina. */
export function leasesFile(env: NodeJS.ProcessEnv = process.env): string {
  return join(taskinStateDir(env, homedir()), 'leases.json');
}

function openBroker(root: string) {
  const local = openLocalInventory(root);
  const clock = { now: () => instant(Date.now()) };
  const ports: AccessBrokerPorts = {
    clock,
    secrets: createEnvSecretStore(),
    usage: { usage: async () => undefined },
    settings: { leaseTtlMs: LEASE_TTL_MS, factTtlMs: FACT_TTL_MS },
    catalog: local.inventory,
    runs: createLocalRunLedger({ clock }, runLedgerFiles(root)),
  };
  return { ...local, broker: createLocalAccessBroker(ports, leasesFile()) };
}

/** O nome logico de cada acesso, pelo id, para nunca mostrar mais que isso. */
async function accessNames(broker: ReturnType<typeof openBroker>): Promise<Map<string, string>> {
  const view = await broker.inventory.view(broker.person, broker.repository);
  return new Map(view.resources.map((r) => [String(r.id), r.name]));
}

interface RunOptions {
  sensitivity?: string;
  task?: string;
  access?: string;
  model?: string;
}

/** A variavel em que o comando recebe o modelo que o plano escolheu. */
export const MODEL_ENV_VAR = 'TASKIN_MODEL';

function exitCodeOf(code: number | null, signal: NodeJS.Signals | null): number {
  if (code !== null) return code;
  return 128 + (signal ? constants.signals[signal] : 1);
}

/** Roda o comando com o ambiente do acesso e repassa os sinais; resolve com o codigo de saida. */
function runChild(command: string[], env: Readonly<Record<string, string>>): Promise<number> {
  return new Promise((resolve) => {
    const [file, ...args] = command as [string, ...string[]];
    const child = spawn(file, args, { stdio: 'inherit', env: { ...process.env, ...env } });
    const forward = (signal: NodeJS.Signals) => {
      if (child.exitCode === null && child.signalCode === null) child.kill(signal);
    };
    for (const signal of FORWARDED_SIGNALS) process.on(signal, forward);
    const done = (code: number) => {
      for (const signal of FORWARDED_SIGNALS) process.off(signal, forward);
      resolve(code);
    };
    child.on('error', (failure) => {
      console.error(`Could not run "${file}": ${failure.message}`);
      done(127);
    });
    child.on('exit', (code, signal) => done(exitCodeOf(code, signal)));
  });
}

async function runWithAccess(kind: string, command: string[], options: RunOptions): Promise<void> {
  requireTaskinProject();
  if (command.length === 0) {
    console.error('Nothing to run. Usage: taskin access run <kind> -- <command> [args...]');
    process.exit(1);
  }
  const sensitivity = (options.sensitivity ?? 'public') as DataClass;
  if (!SENSITIVITIES.includes(sensitivity)) {
    console.error(`Unknown sensitivity "${options.sensitivity}". Use one of: ${SENSITIVITIES.join(', ')}`);
    process.exit(1);
  }

  const local = openBroker(process.cwd());
  const broker: IAccessBroker = local.broker;
  const names = await accessNames(local);
  // O nome logico vira o id pelo inventario; um nome que nao existe segue como esta, e o broker o recusa.
  const pinned =
    options.access === undefined
      ? undefined
      : resourceId([...names].find(([, name]) => name === options.access)?.[0] ?? options.access);
  const grant = await broker.requestLease(local.person, {
    repository: local.repository,
    task: taskRef(options.task ?? 'manual'),
    kind: accessKind(kind),
    sensitivity,
    ...(pinned === undefined ? {} : { access: pinned }),
  });
  if (grant.state === 'denied') {
    console.error(`Access denied (${grant.reason.code}): ${grant.reason.detail}`);
    process.exit(1);
  }

  const name = names.get(String(grant.access)) ?? String(grant.access);
  console.error(
    grant.reserved
      ? `Reserved "${name}"${grant.shared ? ' (shared with another run)' : ''} until ${new Date(grant.expiresAt).toISOString()}.`
      : `Using "${name}".`,
  );

  let code: number;
  try {
    code = await runChild(
      command,
      options.model === undefined ? grant.env : { ...grant.env, [MODEL_ENV_VAR]: options.model },
    );
  } finally {
    if (grant.reserved) await broker.returnLease(grant);
  }
  process.exit(code);
}

async function showReservations(options: { json?: boolean }): Promise<void> {
  requireTaskinProject();
  const local = openBroker(process.cwd());
  const leases = await local.broker.leases();
  const names = await accessNames(local);
  const rows = leases.map((l) => ({
    access: names.get(String(l.access)) ?? String(l.access),
    task: String(l.task),
    person: String(l.person),
    shared: l.shared,
    grantedAt: new Date(l.grantedAt).toISOString(),
    expiresAt: new Date(l.expiresAt).toISOString(),
  }));
  if (options.json) {
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    return;
  }
  if (rows.length === 0) {
    console.log('No accounts reserved.');
    return;
  }
  for (const r of rows) {
    console.log(`${r.access}  task ${r.task}  ${r.person}${r.shared ? '  shared' : ''}  until ${r.expiresAt}`);
  }
}

export function registerAccessCommand(program: Command): void {
  const access = program
    .command('access')
    .description('🔑 Give commands on this machine the credentials of an account');

  access
    .command('run <kind> [command...]')
    .description(
      'Pick an account of <kind>, run the command with its secret in the environment, and, if the account declares capacity (concurrencyLimit), reserve a slot until the command ends',
    )
    .option('--sensitivity <level>', `What the task shows the model: ${SENSITIVITIES.join(', ')}`, 'public')
    .option('--task <id>', 'The task this run is for')
    .option(
      '--access <name>',
      'Use this account (its logical name), as the plan assigned it, instead of the least busy one; denied if it is not cleared or has no free slot',
    )
    .option('--model <model>', `The model the plan chose, passed to the command in ${MODEL_ENV_VAR}`)
    .action(async (kind: string, command: string[], options: RunOptions) => {
      await runWithAccess(kind, command, options);
    });

  access
    .command('status')
    .description(
      'The accounts reserved on this machine (those that declare capacity), by logical name, without secrets',
    )
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      await showReservations(options);
    });
}
