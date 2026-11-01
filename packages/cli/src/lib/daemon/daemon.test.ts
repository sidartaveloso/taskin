import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DaemonManager,
  DaemonStateFile,
  describeStatus,
  installTarget,
  LAUNCHD_LABEL,
  PidFileLock,
  SYSTEMD_UNIT,
  stateDir,
} from './daemon.js';
import { DaemonServiceMock } from './daemon.mock.js';

describe('DaemonManager', () => {
  it('starts every registered service and stops them in reverse order', async () => {
    const log: string[] = [];
    const manager = new DaemonManager();
    manager.register(new DaemonServiceMock('alexa', undefined, log));
    manager.register(new DaemonServiceMock('perception', undefined, log));

    const report = await manager.startAll();
    expect(report).toEqual([
      { name: 'alexa', status: { state: 'running' } },
      { name: 'perception', status: { state: 'running' } },
    ]);

    await manager.stopAll();
    expect(log).toEqual(['start:alexa', 'start:perception', 'stop:perception', 'stop:alexa']);
    expect(manager.report().every((r) => r.status.state === 'stopped')).toBe(true);
  });

  it('a service that fails to start does not bring the others down and shows the reason', async () => {
    const manager = new DaemonManager();
    const broken = new DaemonServiceMock('broken', new Error('port 4000 in use'));
    const healthy = new DaemonServiceMock('healthy');
    manager.register(broken);
    manager.register(healthy);

    const report = await manager.startAll();
    expect(report).toEqual([
      { name: 'broken', status: { state: 'failed', reason: 'port 4000 in use' } },
      { name: 'healthy', status: { state: 'running' } },
    ]);

    await manager.stopAll();
    expect(broken.stopCalls).toBe(0);
    expect(healthy.stopCalls).toBe(1);
  });

  it('refuses two services with the same name', () => {
    const manager = new DaemonManager();
    manager.register(new DaemonServiceMock('x'));
    expect(() => manager.register(new DaemonServiceMock('x'))).toThrow(/already registered/);
  });

  it('with no service registered, starts nothing and reports an empty list', async () => {
    expect(await new DaemonManager().startAll()).toEqual([]);
  });
});

describe('stateDir', () => {
  it('uses $XDG_STATE_HOME/taskin when set', () => {
    expect(stateDir({ XDG_STATE_HOME: '/x/state' }, '/home/ana')).toBe('/x/state/taskin');
  });

  it('defaults to ~/.local/state/taskin, on macOS too', () => {
    expect(stateDir({}, '/Users/ana')).toBe('/Users/ana/.local/state/taskin');
  });
});

describe('PidFileLock', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'taskin-daemon-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('the first instance takes the lock and writes its PID', () => {
    const lock = new PidFileLock(join(dir, 'taskin'), 111, () => true);
    expect(lock.acquire()).toEqual({ kind: 'acquired' });
    expect(readFileSync(lock.path, 'utf8').trim()).toBe('111');
  });

  it('a second instance finds the lock held by a live process', () => {
    new PidFileLock(dir, 111, () => true).acquire();
    expect(new PidFileLock(dir, 222, () => true).acquire()).toEqual({ kind: 'held', pid: 111 });
  });

  it('a lock left by a dead process is reclaimed', () => {
    new PidFileLock(dir, 111, () => true).acquire();
    const second = new PidFileLock(dir, 222, (pid) => pid !== 111);
    expect(second.acquire()).toEqual({ kind: 'acquired', reclaimedFromPid: 111 });
    expect(readFileSync(second.path, 'utf8').trim()).toBe('222');
  });

  it('a garbage lock file is reclaimed', () => {
    writeFileSync(join(dir, 'daemon.pid'), 'not a pid');
    expect(new PidFileLock(dir, 222, () => true).acquire().kind).toBe('acquired');
  });

  it('release only removes the lock it owns', () => {
    const first = new PidFileLock(dir, 111, () => true);
    first.acquire();
    new PidFileLock(dir, 222, () => true).release();
    expect(readFileSync(first.path, 'utf8').trim()).toBe('111');
    first.release();
    expect(new PidFileLock(dir, 333, () => true).acquire()).toEqual({ kind: 'acquired' });
  });
});

describe('DaemonStateFile', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'taskin-daemon-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('is not running when there is no lock', () => {
    expect(new DaemonStateFile(dir, () => true).read()).toEqual({ kind: 'not-running' });
  });

  it('is not running when the lock belongs to a dead process', () => {
    new PidFileLock(dir, 111, () => true).acquire();
    expect(new DaemonStateFile(dir, () => false).read()).toEqual({ kind: 'not-running' });
  });

  it('reads back the snapshot the running daemon wrote', () => {
    new PidFileLock(dir, 111, () => true).acquire();
    const file = new DaemonStateFile(dir, () => true);
    const snapshot = {
      pid: 111,
      startedAt: '2026-11-01T10:00:00.000Z',
      services: [{ name: 'alexa', status: { state: 'failed' as const, reason: 'no token' } }],
    };
    file.write(snapshot);
    expect(file.read()).toEqual({ kind: 'running', snapshot });
  });
});

describe('describeStatus', () => {
  const now = new Date('2026-11-01T12:30:05.000Z');

  it('says when it is not running', () => {
    expect(describeStatus({ kind: 'not-running' }, now).join('\n')).toMatch(/not running/);
  });

  it('gives PID, since when, and each service with the failure reason', () => {
    const lines = describeStatus(
      {
        kind: 'running',
        snapshot: {
          pid: 4242,
          startedAt: '2026-11-01T10:00:00.000Z',
          services: [
            { name: 'alexa', status: { state: 'failed', reason: 'no token' } },
            { name: 'perception', status: { state: 'running' } },
          ],
        },
      },
      now,
    );
    expect(lines[0]).toContain('PID 4242');
    expect(lines[0]).toContain('since 2026-11-01T10:00:00.000Z (2h 30m)');
    expect(lines).toContain('  alexa: failed — no token');
    expect(lines).toContain('  perception: running');
  });

  it('with no service registered, says so instead of looking broken', () => {
    const lines = describeStatus(
      { kind: 'running', snapshot: { pid: 1, startedAt: '2026-11-01T12:30:00.000Z', services: [] } },
      now,
    );
    expect(lines.join('\n')).toMatch(/No services are registered yet/);
  });
});

describe('installTarget', () => {
  const base = { home: '/home/ana', execPath: '/usr/bin/node', cliScript: '/opt/taskin/dist/index.js' };

  it('macOS: a launchd agent in ~/Library/LaunchAgents that runs at load', () => {
    const target = installTarget({ ...base, platform: 'darwin', home: '/Users/ana' });
    if (target.kind !== 'supported') throw new Error('expected supported');
    const { path, content, enable, disable } = target.definition;
    expect(path).toBe(`/Users/ana/Library/LaunchAgents/${LAUNCHD_LABEL}.plist`);
    expect(content).toContain(`<string>${LAUNCHD_LABEL}</string>`);
    expect(content).toContain('<key>RunAtLoad</key>\n  <true/>');
    expect(content).toContain(
      '    <string>/usr/bin/node</string>\n    <string>/opt/taskin/dist/index.js</string>\n    <string>daemon</string>\n    <string>run</string>',
    );
    expect(content).toContain('/Users/ana/.local/state/taskin/daemon.out.log');
    expect(enable).toEqual([['launchctl', 'load', '-w', path]]);
    expect(disable).toEqual([['launchctl', 'unload', '-w', path]]);
  });

  it('Linux: a systemd user unit wanted by default.target', () => {
    const target = installTarget({ ...base, platform: 'linux' });
    if (target.kind !== 'supported') throw new Error('expected supported');
    const { path, content, enable } = target.definition;
    expect(path).toBe(`/home/ana/.config/systemd/user/${SYSTEMD_UNIT}`);
    expect(content).toContain('ExecStart="/usr/bin/node" "/opt/taskin/dist/index.js" daemon run');
    expect(content).toContain('WantedBy=default.target');
    expect(content).toContain('Restart=on-failure');
    expect(enable).toContainEqual(['systemctl', '--user', 'enable', '--now', SYSTEMD_UNIT]);
  });

  it('Linux: honours $XDG_CONFIG_HOME', () => {
    const target = installTarget({ ...base, platform: 'linux', xdgConfigHome: '/cfg' });
    expect(target.kind === 'supported' && target.definition.path).toBe(`/cfg/systemd/user/${SYSTEMD_UNIT}`);
  });

  it('any other system is refused', () => {
    expect(installTarget({ ...base, platform: 'win32' })).toEqual({ kind: 'unsupported', platform: 'win32' });
  });
});
