/**
 * `taskin access` — o emprestimo de credenciais desta maquina: `run` empresta
 * um acesso, roda o comando com o segredo so no ambiente dele e devolve no
 * fim; `status` mostra os emprestimos em aberto, sem segredo.
 */

import { spawn } from 'node:child_process';
import { constants, homedir } from 'node:os';
import { join } from 'node:path';
import {
  type AccessBrokerPorts,
  accessKind,
  createEnvSecretStore,
  createLocalAccessBroker,
  type DataClass,
  type IAccessBroker,
  instant,
  taskinStateDir,
  taskRef,
} from '@opentask/taskin-situation';
import type { Command } from 'commander';
import { openLocalInventory } from '../lib/probe-situation.js';
import { requireTaskinProject } from '../lib/project-check.js';

const SENSITIVITIES: readonly DataClass[] = ['public', 'internal', 'sensitive'];
/** O prazo de um emprestimo: se o processo morre sem devolver, a conta volta sozinha depois disto. */
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
}

function exitCodeOf(code: number | null, signal: NodeJS.Signals | null): number {
  if (code !== null) return code;
  return 128 + (signal ? constants.signals[signal] : 1);
}

/** Roda o comando com o ambiente do emprestimo e repassa os sinais; resolve com o codigo de saida. */
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

async function runWithLease(kind: string, command: string[], options: RunOptions): Promise<void> {
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
  const lease = await broker.requestLease(local.person, {
    repository: local.repository,
    task: taskRef(options.task ?? 'manual'),
    kind: accessKind(kind),
    sensitivity,
  });
  if (lease.state === 'denied') {
    console.error(`Access denied (${lease.reason.code}): ${lease.reason.detail}`);
    process.exit(1);
  }

  const name = (await accessNames(local)).get(String(lease.access)) ?? String(lease.access);
  console.error(
    `Lent "${name}"${lease.shared ? ' (shared with another run)' : ''} until ${new Date(lease.expiresAt).toISOString()}.`,
  );

  let code: number;
  try {
    code = await runChild(command, lease.env);
  } finally {
    await broker.returnLease(lease);
  }
  process.exit(code);
}

async function showLeases(options: { json?: boolean }): Promise<void> {
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
    console.log('No open leases.');
    return;
  }
  for (const r of rows) {
    console.log(`${r.access}  task ${r.task}  ${r.person}${r.shared ? '  shared' : ''}  until ${r.expiresAt}`);
  }
}

export function registerAccessCommand(program: Command): void {
  const access = program.command('access').description('🔑 Lend credentials to commands on this machine');

  access
    .command('run <kind> [command...]')
    .description('Lend an access of <kind>, run the command with it in its environment, and return it at the end')
    .option('--sensitivity <level>', `What the task shows the model: ${SENSITIVITIES.join(', ')}`, 'public')
    .option('--task <id>', 'The task this run is for')
    .action(async (kind: string, command: string[], options: RunOptions) => {
      await runWithLease(kind, command, options);
    });

  access
    .command('status')
    .description('The open leases on this machine, by the logical name of each access, without secrets')
    .option('--json', 'Output as JSON')
    .action(async (options: { json?: boolean }) => {
      await showLeases(options);
    });
}
