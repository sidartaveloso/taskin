/**
 * task-251, de ponta a ponta: o `new` e o `list` rodados numa worktree de
 * feature enxergam as tasks da worktree da develop e das refs locais, sem
 * rede (o remoto e uma pasta, e o autoSync esta desligado).
 *
 * O cenario e o que motivou a task: a task-048 do sidartaveloso nasceu na
 * worktree da develop e nao aparecia na da feature.
 */

import { execFileSync } from 'child_process';
import { Command } from 'commander';
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function task(id: string, title: string, status: string): string {
  return `# 🧩 Task ${id} — ${title}\n\n- Status: ${status}\n- Type: feat\n- Assignee: ana\n\n## Description\nx\n`;
}

describe('new e list numa worktree de feature', () => {
  let root: string;
  let main: string;
  let feature: string;
  let cwdSpy: MockInstance;
  let saida: string[];
  let erros: string[];
  const spies: MockInstance[] = [];

  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'taskin-worktrees-')));
    const remote = join(root, 'remote.git');
    main = join(root, 'main');
    feature = join(root, 'feature');

    git(root, 'init', '-q', '--bare', '-b', 'develop', remote);
    git(root, 'clone', '-q', remote, main);
    git(main, 'config', 'user.email', 'test@taskin.dev');
    git(main, 'config', 'user.name', 'Taskin Test');
    git(main, 'checkout', '-q', '-b', 'develop');
    mkdirSync(join(main, 'TASKS'));
    writeFileSync(
      join(main, '.taskin.json'),
      JSON.stringify({
        version: '1.0.0',
        automation: { level: 'assisted', autoSync: false },
        provider: { type: 'fs', config: {} },
      }),
    );
    writeFileSync(join(main, 'TASKS', 'task-001-base.md'), task('001', 'Base', 'done'));
    git(main, 'add', '.');
    git(main, 'commit', '-q', '-m', 'inicio');
    git(main, 'push', '-q', '-u', 'origin', 'develop');
    git(main, 'worktree', 'add', '-q', '-b', 'feat/x', feature, 'develop');

    // Criada na develop depois que a feature saiu, e ainda nao commitada.
    writeFileSync(join(main, 'TASKS', 'task-048-guia.md'), task('048', 'Guia', 'pending'));

    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(feature);
    saida = [];
    erros = [];
    spies.push(
      vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void saida.push(a.map(String).join(' '))),
      vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => void erros.push(a.map(String).join(' '))),
      vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => void erros.push(a.map(String).join(' '))),
    );
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    for (const s of spies.splice(0)) s.mockRestore();
    rmSync(root, { recursive: true, force: true });
  });

  it('o new numera depois da task criada na outra worktree', async () => {
    const { createTask } = await import('./new.js');

    await createTask({ type: 'feat', title: 'Depois do guia', user: 'ana' });

    expect(existsSync(join(feature, 'TASKS', 'task-049-depois-do-guia.md'))).toBe(true);
  });

  it('o list --json traz a task da outra worktree, com a origem', async () => {
    const { listCommand } = await import('./list.js');
    const program = new Command();
    listCommand(program);

    await program.parseAsync(['node', 'taskin', 'list', '--json']);

    const itens = JSON.parse(saida.join('\n')) as { id: string; source?: string }[];
    const guia = itens.find((i) => i.id === '048');
    expect(guia?.source).toBe(`worktree develop (${main})`);
    expect(itens.find((i) => i.id === '001')?.source).toBeUndefined();
  });

  it('o list avisa quando o status diverge, sem sujar o JSON', async () => {
    writeFileSync(join(main, 'TASKS', 'task-001-base.md'), task('001', 'Base', 'in-progress'));
    const { listCommand } = await import('./list.js');
    const program = new Command();
    listCommand(program);

    await program.parseAsync(['node', 'taskin', 'list', '--all', '--json']);

    expect(() => JSON.parse(saida.join('\n'))).not.toThrow();
    expect(erros.join('\n')).toContain(`task-001: done here, in-progress in worktree develop (${main})`);
  });
});
