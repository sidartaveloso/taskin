/**
 * `taskin daemon` — o processo em segundo plano: roda, instala com o login,
 * desinstala e diz o que esta rodando.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Command } from 'commander';
import { error, info, success, warning } from '../lib/colors.js';
import {
  DaemonManager,
  DaemonStateFile,
  describeStatus,
  type IDaemonService,
  installTarget,
  PidFileLock,
  type ServiceDefinition,
  stateDir,
} from '../lib/daemon/index.js';

const SNAPSHOT_INTERVAL_MS = 30_000;

/** Onde outras partes (a conexao da Alexa, a percepcao viva) penduram o que precisa ficar rodando. */
export function registeredServices(): IDaemonService[] {
  return [];
}

function currentStateDir(): string {
  return stateDir(process.env, homedir());
}

function makeLogger(directory: string): (message: string) => void {
  const path = join(directory, 'daemon.log');
  return (message) => {
    const line = `${new Date().toISOString()} ${message}`;
    try {
      appendFileSync(path, `${line}\n`);
    } catch {
      // the log is best effort; the daemon keeps running without it
    }
    if (process.stdout.isTTY) console.log(line);
  };
}

async function runDaemon(): Promise<void> {
  const directory = currentStateDir();
  mkdirSync(directory, { recursive: true });
  const lock = new PidFileLock(directory);
  const acquired = lock.acquire();
  if (acquired.kind === 'held') {
    info(`The taskin daemon is already running (PID ${acquired.pid}).`);
    return;
  }

  const log = makeLogger(directory);
  if (acquired.reclaimedFromPid !== undefined) {
    log(`reclaimed the lock left by PID ${acquired.reclaimedFromPid}, which is no longer running`);
  }

  const startedAt = new Date().toISOString();
  const stateFile = new DaemonStateFile(directory);
  const manager = new DaemonManager();
  for (const service of registeredServices()) manager.register(service);

  const writeSnapshot = (): void => stateFile.write({ pid: process.pid, startedAt, services: manager.report() });

  log(`started, PID ${process.pid}`);
  const report = await manager.startAll();
  if (report.length === 0) log('no services registered');
  for (const { name, status } of report) {
    log(
      status.state === 'failed'
        ? `service ${name} failed to start: ${status.reason}`
        : `service ${name} ${status.state}`,
    );
  }
  writeSnapshot();
  const timer = setInterval(writeSnapshot, SNAPSHOT_INTERVAL_MS);

  await new Promise<void>((resolve) => {
    let stopping = false;
    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
      if (stopping) return;
      stopping = true;
      log(`${signal} received, stopping`);
      clearInterval(timer);
      await manager.stopAll();
      stateFile.clear();
      lock.release();
      log('stopped');
      resolve();
    };
    process.once('SIGINT', (s) => void shutdown(s));
    process.once('SIGTERM', (s) => void shutdown(s));
  });
}

function runSteps(steps: ServiceDefinition['enable']): boolean {
  for (const [command, ...args] of steps) {
    const result = spawnSync(command ?? '', args, { stdio: 'inherit' });
    if (result.error || result.status !== 0) {
      error(`"${[command, ...args].join(' ')}" failed${result.error ? `: ${result.error.message}` : ''}.`);
      return false;
    }
  }
  return true;
}

function resolveDefinition(): ServiceDefinition {
  const target = installTarget({
    platform: process.platform,
    home: homedir(),
    execPath: process.execPath,
    cliScript: realpathSync(process.argv[1] ?? ''),
    xdgConfigHome: process.env.XDG_CONFIG_HOME,
  });
  if (target.kind === 'unsupported') {
    error(
      `Starting with the login is supported on macOS (launchd) and Linux (systemd), not on "${target.platform}". Use "taskin daemon run" instead.`,
    );
    process.exit(1);
  }
  return target.definition;
}

function install(): void {
  const definition = resolveDefinition();
  mkdirSync(dirname(definition.path), { recursive: true });
  mkdirSync(currentStateDir(), { recursive: true });
  writeFileSync(definition.path, definition.content);
  success(`Wrote ${definition.path}`);
  if (!runSteps(definition.enable)) process.exit(1);
  success('The taskin daemon now starts with your login. Check it with "taskin daemon status".');
}

function uninstall(): void {
  const definition = resolveDefinition();
  if (!existsSync(definition.path)) {
    info(`Nothing to uninstall: ${definition.path} does not exist.`);
    return;
  }
  if (!runSteps(definition.disable)) warning('Could not stop the running daemon; removing the file anyway.');
  rmSync(definition.path, { force: true });
  success(`Removed ${definition.path}. The taskin daemon no longer starts with your login.`);
}

function status(): void {
  for (const line of describeStatus(new DaemonStateFile(currentStateDir()).read(), new Date())) console.log(line);
}

/**
 * Uma funcao, e nao `defineCommand`, pelo mesmo motivo do `group`: tem subcomandos.
 *
 * @public
 */
export function registerDaemonCommand(program: Command): void {
  const cmd = program
    .command('daemon')
    .description('\u{1F6F0}️  Run taskin in the background and see what it is running');

  cmd.command('run').description('Run the daemon in the foreground until SIGINT or SIGTERM').action(runDaemon);
  cmd
    .command('install')
    .description('Start the daemon with your login (launchd on macOS, systemd on Linux)')
    .action(install);
  cmd.command('uninstall').description('Stop starting the daemon with your login').action(uninstall);
  cmd
    .command('status', { isDefault: true })
    .description('Whether the daemon is up, since when, its PID and each service')
    .action(status);
}
