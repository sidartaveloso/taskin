import type { IUserRegistry } from '@opentask/taskin-task-manager';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemMetricsAdapter } from './file-system-metrics-adapter';

let tasksDir: string;

const ANA = { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' };

const registry: IUserRegistry = {
  load: async () => {},
  getUser: (id) => (id === ANA.id ? ANA : undefined),
  resolveUser: (nameOrId) =>
    nameOrId === ANA.id || nameOrId.toLowerCase() === ANA.name.toLowerCase() ? ANA : undefined,
  ensureCurrentUser: async () => ANA,
  createTemporaryUser: (nameOrId) => ({ id: nameOrId, name: nameOrId, email: `${nameOrId}@invalid` }),
  getAllUsers: () => [ANA],
  saveUser: async () => {},
};

function writeTask(id: string, assignee: string, status = 'done'): void {
  writeFileSync(
    join(tasksDir, `task-${id}-alvo.md`),
    `# Task ${id} — Alvo\n\nStatus: ${status}\nType: feat\nAssignee: ${assignee}\n\n## Description\n\nx\n`,
    'utf-8',
  );
}

beforeEach(() => {
  tasksDir = mkdtempSync(join(tmpdir(), 'taskin-metrics-identity-'));
  mkdirSync(tasksDir, { recursive: true });
});

afterEach(() => {
  rmSync(tasksDir, { recursive: true, force: true });
});

describe('FileSystemMetricsAdapter — identidade do contribuidor', () => {
  it('counts the same person once, however their assignee is spelled', async () => {
    writeTask('001', 'Ana Souza');
    writeTask('002', 'ana-souza');
    writeTask('003', 'anasouza');

    const adapter = new FileSystemMetricsAdapter(tasksDir, registry, undefined);
    const stats = await adapter.getTeamMetrics('default', { period: 'all' });

    expect(stats.contributors).toHaveLength(1);
    expect(stats.contributors[0]?.username).toBe('Ana Souza');
    expect(stats.contributors[0]?.tasksCompleted).toBe(3);
  });

  it('does not report a placeholder as a contributor', async () => {
    writeTask('004', 'A definir');
    writeTask('005', 'To be defined');

    const adapter = new FileSystemMetricsAdapter(tasksDir, registry, undefined);
    const stats = await adapter.getTeamMetrics('default', { period: 'all' });

    expect(stats.contributors.map((contributor) => contributor.username)).not.toContain('A definir');
    expect(stats.contributors.map((contributor) => contributor.username)).not.toContain('To be defined');
  });

  it('still reports an unregistered person, since the work happened', async () => {
    writeTask('006', 'fernandogatti');

    const adapter = new FileSystemMetricsAdapter(tasksDir, registry, undefined);
    const stats = await adapter.getTeamMetrics('default', { period: 'all' });

    expect(stats.contributors.map((contributor) => contributor.username)).toContain('fernandogatti');
  });

  /*
   * Tratar o placeholder como "ninguem" nao pode fazer o trabalho desaparecer:
   * o total do time some 3 tasks se ele for derivado so das somas por pessoa.
   */
  it('still counts a finished task that has nobody assigned in the team total', async () => {
    writeTask('007', 'A definir', 'done');
    writeTask('008', 'Ana Souza', 'done');

    const adapter = new FileSystemMetricsAdapter(tasksDir, registry, undefined);
    const stats = await adapter.getTeamMetrics('default', { period: 'all' });

    expect(stats.totalTasksCompleted).toBe(2);
    expect(stats.contributors).toHaveLength(1);
  });
});
