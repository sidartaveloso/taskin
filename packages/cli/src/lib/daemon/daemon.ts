import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type {
  DaemonSnapshot,
  DaemonStatus,
  IDaemonManager,
  IDaemonService,
  IInstanceLock,
  InstallEnvironment,
  InstallTarget,
  LockResult,
  ServiceReport,
} from './daemon.types.js';

export const LAUNCHD_LABEL = 'br.com.opentask.taskin';
export const SYSTEMD_UNIT = 'taskin.service';

export function stateDir(env: NodeJS.ProcessEnv = process.env, home = env.HOME ?? ''): string {
  const base = env.XDG_STATE_HOME && env.XDG_STATE_HOME.length > 0 ? env.XDG_STATE_HOME : join(home, '.local', 'state');
  return join(base, 'taskin');
}

function describeFailure(failure: unknown): string {
  return failure instanceof Error ? failure.message : String(failure);
}

export class DaemonManager implements IDaemonManager {
  private readonly services: IDaemonService[] = [];
  private readonly startFailures = new Map<string, string>();

  register(service: IDaemonService): void {
    if (this.services.some((s) => s.name === service.name)) {
      throw new Error(`A service named "${service.name}" is already registered.`);
    }
    this.services.push(service);
  }

  async startAll(): Promise<ServiceReport[]> {
    for (const service of this.services) {
      try {
        await service.start();
        this.startFailures.delete(service.name);
      } catch (failure) {
        this.startFailures.set(service.name, describeFailure(failure));
      }
    }
    return this.report();
  }

  async stopAll(): Promise<void> {
    for (const service of [...this.services].reverse()) {
      if (this.startFailures.has(service.name)) continue;
      try {
        await service.stop();
      } catch (failure) {
        this.startFailures.set(service.name, `failed to stop: ${describeFailure(failure)}`);
      }
    }
  }

  report(): ServiceReport[] {
    return this.services.map((service) => {
      const reason = this.startFailures.get(service.name);
      return { name: service.name, status: reason !== undefined ? { state: 'failed', reason } : service.status() };
    });
  }
}

export type IsAlive = (pid: number) => boolean;

export const isProcessAlive: IsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (failure) {
    return (failure as NodeJS.ErrnoException).code === 'EPERM';
  }
};

function readPid(path: string): number | undefined {
  if (!existsSync(path)) return undefined;
  const pid = Number.parseInt(readFileSync(path, 'utf8').trim(), 10);
  return Number.isInteger(pid) && pid > 0 ? pid : undefined;
}

export class PidFileLock implements IInstanceLock {
  readonly path: string;

  constructor(
    directory: string,
    private readonly pid: number = process.pid,
    private readonly isAlive: IsAlive = isProcessAlive,
  ) {
    this.path = join(directory, 'daemon.pid');
  }

  acquire(): LockResult {
    mkdirSync(dirname(this.path), { recursive: true });
    const holder = readPid(this.path);
    if (holder !== undefined && holder !== this.pid && this.isAlive(holder)) {
      return { kind: 'held', pid: holder };
    }
    try {
      writeFileSync(this.path, `${this.pid}\n`, { flag: holder === undefined ? 'wx' : 'w' });
    } catch (failure) {
      if ((failure as NodeJS.ErrnoException).code !== 'EEXIST') throw failure;
      const racer = readPid(this.path);
      if (racer !== undefined) return { kind: 'held', pid: racer };
      writeFileSync(this.path, `${this.pid}\n`);
    }
    return holder !== undefined && holder !== this.pid
      ? { kind: 'acquired', reclaimedFromPid: holder }
      : { kind: 'acquired' };
  }

  release(): void {
    if (readPid(this.path) === this.pid) rmSync(this.path, { force: true });
  }
}

export class DaemonStateFile {
  readonly path: string;

  constructor(
    private readonly directory: string,
    private readonly isAlive: IsAlive = isProcessAlive,
  ) {
    this.path = join(directory, 'daemon.json');
  }

  write(snapshot: DaemonSnapshot): void {
    mkdirSync(this.directory, { recursive: true });
    writeFileSync(this.path, `${JSON.stringify(snapshot, null, 2)}\n`);
  }

  clear(): void {
    rmSync(this.path, { force: true });
  }

  read(): DaemonStatus {
    const pid = readPid(join(this.directory, 'daemon.pid'));
    if (pid === undefined || !this.isAlive(pid)) return { kind: 'not-running' };
    if (!existsSync(this.path)) return { kind: 'running', snapshot: { pid, startedAt: '', services: [] } };
    const parsed: unknown = JSON.parse(readFileSync(this.path, 'utf8'));
    return { kind: 'running', snapshot: { ...toSnapshot(parsed), pid } };
  }
}

function toSnapshot(value: unknown): DaemonSnapshot {
  const record = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const services = Array.isArray(record.services) ? (record.services as ServiceReport[]) : [];
  return {
    pid: typeof record.pid === 'number' ? record.pid : 0,
    startedAt: typeof record.startedAt === 'string' ? record.startedAt : '',
    services,
  };
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function quoteSystemd(text: string): string {
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function launchdPlist(execPath: string, cliScript: string, logDir: string): string {
  const args = [execPath, cliScript, 'daemon', 'run'].map((a) => `    <string>${escapeXml(a)}</string>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
${args}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
  <key>StandardOutPath</key>
  <string>${escapeXml(join(logDir, 'daemon.out.log'))}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(join(logDir, 'daemon.out.log'))}</string>
</dict>
</plist>
`;
}

export function systemdUnit(execPath: string, cliScript: string): string {
  return `[Unit]
Description=Taskin background process

[Service]
Type=simple
ExecStart=${[execPath, cliScript].map(quoteSystemd).join(' ')} daemon run
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
`;
}

export function installTarget(env: InstallEnvironment): InstallTarget {
  if (env.platform === 'darwin') {
    const path = join(env.home, 'Library', 'LaunchAgents', `${LAUNCHD_LABEL}.plist`);
    return {
      kind: 'supported',
      definition: {
        platform: 'darwin',
        path,
        content: launchdPlist(env.execPath, env.cliScript, stateDir({}, env.home)),
        enable: [['launchctl', 'load', '-w', path]],
        disable: [['launchctl', 'unload', '-w', path]],
      },
    };
  }
  if (env.platform === 'linux') {
    const configHome =
      env.xdgConfigHome && env.xdgConfigHome.length > 0 ? env.xdgConfigHome : join(env.home, '.config');
    return {
      kind: 'supported',
      definition: {
        platform: 'linux',
        path: join(configHome, 'systemd', 'user', SYSTEMD_UNIT),
        content: systemdUnit(env.execPath, env.cliScript),
        enable: [
          ['systemctl', '--user', 'daemon-reload'],
          ['systemctl', '--user', 'enable', '--now', SYSTEMD_UNIT],
        ],
        disable: [['systemctl', '--user', 'disable', '--now', SYSTEMD_UNIT]],
      },
    };
  }
  return { kind: 'unsupported', platform: env.platform };
}

export function formatUptime(startedAt: string, now: Date): string {
  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) return 'unknown';
  let seconds = Math.max(0, Math.floor((now.getTime() - started.getTime()) / 1000));
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  const parts = [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${seconds}s`];
  return parts.filter(Boolean).slice(0, 2).join(' ');
}

export function describeStatus(status: DaemonStatus, now: Date): string[] {
  if (status.kind === 'not-running') {
    return ['The taskin daemon is not running. Start it with "taskin daemon run" or "taskin daemon install".'];
  }
  const { snapshot } = status;
  const since = snapshot.startedAt
    ? `since ${snapshot.startedAt} (${formatUptime(snapshot.startedAt, now)})`
    : 'since an unknown time';
  const lines = [`The taskin daemon is running, PID ${snapshot.pid}, ${since}.`];
  if (snapshot.services.length === 0) {
    lines.push('No services are registered yet: the daemon is up and has nothing to run.');
    return lines;
  }
  for (const { name, status: s } of snapshot.services) {
    lines.push(s.state === 'failed' ? `  ${name}: failed — ${s.reason}` : `  ${name}: ${s.state}`);
  }
  return lines;
}
