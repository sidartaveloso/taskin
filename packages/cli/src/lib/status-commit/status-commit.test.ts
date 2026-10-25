/**
 * O que acontece com uma mudanca de status — task-135.
 *
 * O commit de status vai so para a branch corrente, restrito ao arquivo da
 * task, sem checkout nem stash: assim funciona numa worktree com a branch
 * padrao aberta no checkout principal. Com `autoSync` e `defaultBranch`, o
 * mesmo status e publicado em `origin/<defaultBranch>`, o quadro compartilhado.
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import { parseTaskId } from '@opentask/taskin-types';
import { describe, expect, it, vi } from 'vitest';
import type { AutomationBehavior } from '../config-manager.js';
import { recordTaskStatusChange } from './index.js';

function createMockGitService(): IGitService {
  return {
    addFiles: vi.fn().mockResolvedValue(true),
    commit: vi.fn().mockResolvedValue(true),
    commitWork: vi.fn().mockResolvedValue({ status: 'nothing-to-commit' }),
    addAndCommit: vi.fn().mockResolvedValue(true),
    commitTaskStatusChange: vi.fn().mockResolvedValue(true),
    commitTaskStatusChangeOnBranch: vi.fn().mockResolvedValue(true),
    publishTaskStatusChange: vi.fn().mockResolvedValue({ published: true }),
    hasUncommittedChanges: vi.fn().mockResolvedValue(false),
    getCurrentBranch: vi.fn().mockResolvedValue('sandcastle/rodada-1'),
    isGitRepository: vi.fn().mockResolvedValue(true),
    createBranch: vi.fn().mockResolvedValue(true),
    checkoutBranch: vi.fn().mockResolvedValue(true),
    fetch: vi.fn().mockResolvedValue(true),
    rebase: vi.fn().mockResolvedValue(true),
    push: vi.fn().mockResolvedValue(true),
    abortRebase: vi.fn().mockResolvedValue(true),
    checkoutFile: vi.fn().mockResolvedValue(true),
  };
}

const TASK = parseTaskId('001');

function behavior(overrides: Partial<AutomationBehavior>): AutomationBehavior {
  return { autoCommitStatusChange: true, autoCommitPause: true, autoCommitFinish: true, ...overrides };
}

describe('recordTaskStatusChange', () => {
  it('sem auto-commit de status nao toca no git', async () => {
    const git = createMockGitService();

    const record = await recordTaskStatusChange(git, TASK, 'in-progress', behavior({ autoCommitStatusChange: false }));

    expect(record).toEqual({ outcome: 'not-recorded' });
    expect(git.commitTaskStatusChange).not.toHaveBeenCalled();
    expect(git.publishTaskStatusChange).not.toHaveBeenCalled();
  });

  it('sem autoSync comita so na branch corrente, sem checkout e sem publicar', async () => {
    const git = createMockGitService();

    const record = await recordTaskStatusChange(
      git,
      TASK,
      'in-progress',
      behavior({ autoSync: false, defaultBranch: 'develop' }),
    );

    expect(record).toEqual({ outcome: 'committed' });
    expect(git.commitTaskStatusChange).toHaveBeenCalledWith(TASK, 'in-progress');
    expect(git.commitTaskStatusChangeOnBranch).not.toHaveBeenCalled();
    expect(git.checkoutBranch).not.toHaveBeenCalled();
    expect(git.publishTaskStatusChange).not.toHaveBeenCalled();
  });

  it('com autoSync mas sem defaultBranch nao publica', async () => {
    const git = createMockGitService();

    const record = await recordTaskStatusChange(git, TASK, 'in-progress', behavior({ autoSync: true }));

    expect(record).toEqual({ outcome: 'committed' });
    expect(git.publishTaskStatusChange).not.toHaveBeenCalled();
  });

  it('com autoSync e defaultBranch comita na branch corrente e publica na defaultBranch', async () => {
    const git = createMockGitService();

    const record = await recordTaskStatusChange(
      git,
      TASK,
      'done',
      behavior({ autoSync: true, defaultBranch: 'develop' }),
    );

    expect(record).toEqual({ outcome: 'published', committed: true });
    expect(git.commitTaskStatusChange).toHaveBeenCalledWith(TASK, 'done');
    expect(git.publishTaskStatusChange).toHaveBeenCalledWith(TASK, 'done', 'develop');
    expect(git.commitTaskStatusChangeOnBranch).not.toHaveBeenCalled();
    expect(git.checkoutBranch).not.toHaveBeenCalled();
  });

  it('falha de publicacao devolve o motivo e mantem o commit local', async () => {
    const git = createMockGitService();
    vi.mocked(git.publishTaskStatusChange).mockResolvedValue({ published: false, reason: 'could not fetch' });

    const record = await recordTaskStatusChange(
      git,
      TASK,
      'in-progress',
      behavior({ autoSync: true, defaultBranch: 'develop' }),
    );

    expect(record).toEqual({ outcome: 'not-published', committed: true, reason: 'could not fetch' });
  });

  it('sem remoto origin, o commit local basta: nao ha onde publicar', async () => {
    const git = createMockGitService();
    vi.mocked(git.publishTaskStatusChange).mockResolvedValue({
      published: false,
      reason: 'no remote named origin',
      noRemote: true,
    });

    const record = await recordTaskStatusChange(
      git,
      TASK,
      'in-progress',
      behavior({ autoSync: true, defaultBranch: 'main' }),
    );

    expect(record).toEqual({ outcome: 'committed' });
  });

  it('sem autoSync, commit que falha diz que falhou', async () => {
    const git = createMockGitService();
    vi.mocked(git.commitTaskStatusChange).mockResolvedValue(false);

    const record = await recordTaskStatusChange(git, TASK, 'in-progress', behavior({ autoSync: false }));

    expect(record).toEqual({ outcome: 'commit-failed' });
  });

  it('commit local que falha nao impede a publicacao', async () => {
    const git = createMockGitService();
    vi.mocked(git.commitTaskStatusChange).mockResolvedValue(false);

    const record = await recordTaskStatusChange(
      git,
      TASK,
      'in-progress',
      behavior({ autoSync: true, defaultBranch: 'develop' }),
    );

    expect(record).toEqual({ outcome: 'published', committed: false });
  });
});
