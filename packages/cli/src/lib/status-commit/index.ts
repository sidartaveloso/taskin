/**
 * O que acontece com uma mudanca de status, nas quatro portas que a fazem:
 * `start`, `review`, `finish` e o MCP (task-135).
 *
 * O commit de status vai para a branch corrente, restrito ao arquivo da task.
 * Nada de stash nem de `git checkout <defaultBranch>`: o git nao abre a mesma
 * branch em duas worktrees, e o stash e compartilhado entre elas.
 *
 * Com `autoSync` e `defaultBranch`, o mesmo status e publicado em
 * `origin/<defaultBranch>`, o quadro que todo clone e worktree le. O commit
 * local espelha o publicado: com o arquivo da task limpo, a branch continua
 * recebendo a `defaultBranch` por merge ou rebase.
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import type { TaskId } from '@opentask/taskin-types';
import { success, warning } from '../colors.js';
import type { AutomationBehavior } from '../config-manager.js';

/**
 * O que foi feito com a mudanca de status.
 */
export type StatusChangeRecord =
  | { outcome: 'not-recorded' }
  | { outcome: 'committed' }
  | { outcome: 'commit-failed' }
  | { outcome: 'published'; committed: boolean }
  | { outcome: 'not-published'; committed: boolean; reason: string };

export async function recordTaskStatusChange(
  git: IGitService,
  taskId: TaskId,
  status: string,
  behavior: AutomationBehavior,
): Promise<StatusChangeRecord> {
  if (!behavior.autoCommitStatusChange) return { outcome: 'not-recorded' };

  const committed = await git.commitTaskStatusChange(taskId, status);

  if (!behavior.autoSync || !behavior.defaultBranch) {
    return committed ? { outcome: 'committed' } : { outcome: 'commit-failed' };
  }

  const publication = await git.publishTaskStatusChange(taskId, status, behavior.defaultBranch);
  if (publication.noRemote) {
    return committed ? { outcome: 'committed' } : { outcome: 'commit-failed' };
  }
  return publication.published
    ? { outcome: 'published', committed }
    : { outcome: 'not-published', committed, reason: publication.reason };
}

/** O status ficou num commit da branch corrente. */
export function isStatusCommitted(record: StatusChangeRecord): boolean {
  switch (record.outcome) {
    case 'committed':
      return true;
    case 'published':
    case 'not-published':
      return record.committed;
    case 'not-recorded':
    case 'commit-failed':
      return false;
  }
}

export function reportStatusChangeRecord(record: StatusChangeRecord, defaultBranch?: string): void {
  if (isStatusCommitted(record)) success('Auto-committed status change');

  if (record.outcome === 'published') {
    success(`Status published to origin/${defaultBranch}`);
  } else if (record.outcome === 'not-published') {
    warning(`Status not published to origin/${defaultBranch}: ${record.reason}`);
    warning(
      record.committed
        ? 'The status stays committed on this branch.'
        : 'The status stays changed in the working tree, uncommitted.',
    );
  }
}
