import type { Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { mergeOtherTasks, sourceLabel } from './other-task-sources';
import type { SourcedTask } from './other-task-sources.types';

function task(id: string, status: string, filePath = `/repo/TASKS/task-${id}-x.md`): Task {
  return { id, status, type: 'feat', title: `Task ${id}`, createdAt: '', filePath } as unknown as Task;
}

function sourced(id: string, status: string, source: SourcedTask['source'], fileName = `task-${id}-x.md`): SourcedTask {
  return { task: task(id, status, fileName), fileName, source };
}

const DEVELOP_WT = { kind: 'worktree', path: '/wt/develop', branch: 'develop' } as const;
const ORIGIN = { kind: 'ref', ref: 'origin/develop' } as const;

describe('mergeOtherTasks', () => {
  it('acrescenta a task que so existe em outra fonte, com a de maior precedencia', () => {
    const { extra } = mergeOtherTasks(
      [task('001', 'done')],
      [sourced('048', 'pending', DEVELOP_WT), sourced('048', 'pending', ORIGIN)],
    );

    expect(extra.map((e) => [e.task.id, e.source])).toEqual([['048', DEVELOP_WT]]);
  });

  it('nao repete a task que ja esta na worktree atual', () => {
    const { extra } = mergeOtherTasks([task('001', 'done')], [sourced('001', 'done', ORIGIN)]);

    expect(extra).toEqual([]);
  });

  it('avisa quando o status local difere do da fonte de maior precedencia (a primeira da lista)', () => {
    const { notices } = mergeOtherTasks(
      [task('001', 'in-progress')],
      [sourced('001', 'pending', DEVELOP_WT), sourced('001', 'done', ORIGIN)],
    );

    expect(notices).toEqual(['task-001: in-progress here, pending in worktree develop (/wt/develop)']);
  });

  it('avisa quando o mesmo numero e de arquivos diferentes', () => {
    const { notices } = mergeOtherTasks(
      [task('049', 'pending', '/repo/TASKS/task-049-a.md')],
      [sourced('049', 'pending', ORIGIN, 'task-049-b.md')],
    );

    expect(notices).toEqual([
      'task-049: number used by two files, task-049-a.md here and task-049-b.md in origin/develop',
    ]);
  });
});

describe('sourceLabel', () => {
  it('nomeia a worktree pela branch e a ref pelo nome', () => {
    expect(sourceLabel(DEVELOP_WT)).toBe('worktree develop (/wt/develop)');
    expect(sourceLabel({ kind: 'worktree', path: '/wt/x', branch: null })).toBe('worktree detached (/wt/x)');
    expect(sourceLabel(ORIGIN)).toBe('origin/develop');
  });
});
