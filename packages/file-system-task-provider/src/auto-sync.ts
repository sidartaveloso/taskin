import type { IGitService } from '@opentask/taskin-git-utils';

// ============================================================================
// Types
// ============================================================================

export interface SyncConfig {
  autoSync: boolean;
  defaultBranch?: string;
}

export interface PushAfterCreateOptions {
  taskId: string;
  title: string;
  defaultBranch: string;
}

export interface GetNextTaskNumberOptions {
  autoSync: boolean;
  localCount: number;
  remoteCount: number;
}

export interface SquashTaskFileOnDoneOptions {
  taskId: string;
  defaultBranch: string;
  originBranch?: string;
}

export interface CreateTaskWithSyncResult {
  taskId: string;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRY_ATTEMPTS = 3;

function isNonFastForwardError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('non-fast-forward');
  }
  return false;
}

// ============================================================================
// syncBeforeCreate — Ciclo 3
// ============================================================================

export async function syncBeforeCreate(git: IGitService, config: SyncConfig): Promise<void> {
  if (!config.autoSync || !config.defaultBranch) {
    if (config.autoSync && !config.defaultBranch) {
      console.warn('autoSync is enabled but no defaultBranch is configured. Nothing will be synced.');
    }
    return;
  }

  const fetchOk = await safeCall(() => git.fetch());
  if (!fetchOk) {
    throw new Error('Fetch failed. Check your network connection.');
  }

  const rebaseOk = await safeCall(() => git.rebase(`origin/${config.defaultBranch}`));
  if (!rebaseOk) {
    await git.abortRebase();
    throw new Error('Rebase failed due to conflict. Aborted.');
  }
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T | false> {
  try {
    return await fn();
  } catch {
    return false;
  }
}

// ============================================================================
// pushAfterCreate — Ciclo 5
// ============================================================================

async function attemptPushWithRetry(
  git: IGitService,
  pattern: string,
  message: string,
  branch: string,
  maxAttempts: number,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const fetchOk = await safeCall(() => git.fetch());
      if (!fetchOk) {
        throw new Error('Fetch failed during retry.');
      }
      const rebaseOk = await safeCall(() => git.rebase(`origin/${branch}`));
      if (!rebaseOk) {
        throw new Error('Rebase failed during retry.');
      }
    }

    await git.addAndCommit(pattern, message);

    try {
      const pushOk = await git.push(branch);
      if (pushOk) {
        return;
      }
    } catch (error: unknown) {
      if (!isNonFastForwardError(error)) {
        throw error;
      }
      if (attempt >= maxAttempts) {
        throw new Error(`Push rejected after ${maxAttempts} retries. Exhausted retry limit.`);
      }
      continue;
    }

    if (attempt >= maxAttempts) {
      throw new Error(`Push rejected after ${maxAttempts} retries. Exhausted retry limit.`);
    }
  }

  throw new Error(`Push rejected after ${maxAttempts} retries. Exhausted retry limit.`);
}

export async function pushAfterCreate(git: IGitService, options: PushAfterCreateOptions): Promise<boolean> {
  const pattern = `TASKS/task-${options.taskId}-*.md`;
  const message = `docs(TASKS): task-${options.taskId} - ${options.title} [skip-ci]`;

  await attemptPushWithRetry(git, pattern, message, options.defaultBranch, MAX_RETRY_ATTEMPTS);

  return true;
}

// ============================================================================
// getNextTaskNumberAfterSync — Ciclo 4
// ============================================================================

export async function getNextTaskNumberAfterSync(options: GetNextTaskNumberOptions): Promise<number> {
  const maxLocal = options.localCount;
  const maxRemote = options.remoteCount;

  if (options.autoSync) {
    const maxNumber = Math.max(maxLocal, maxRemote);
    return maxNumber + 1;
  }

  return maxLocal + 1;
}

// ============================================================================
// createTaskWithSync — Ciclo 6
// ============================================================================

export async function createTaskWithSync(
  git: IGitService,
  config: SyncConfig,
  taskOptions: { title: string; type: string },
): Promise<CreateTaskWithSyncResult> {
  await syncBeforeCreate(git, config);

  const nextNumber = await getNextTaskNumberAfterSync({
    autoSync: config.autoSync,
    localCount: 0,
    remoteCount: 0,
  });

  const taskId = String(nextNumber).padStart(3, '0');

  if (config.autoSync && config.defaultBranch) {
    await pushAfterCreate(git, {
      taskId,
      title: taskOptions.title,
      defaultBranch: config.defaultBranch,
    });
  }

  return { taskId };
}

// ============================================================================
// squashTaskFileOnDone — Ciclo 7
// ============================================================================

export async function squashTaskFileOnDone(git: IGitService, options: SquashTaskFileOnDoneOptions): Promise<boolean> {
  if (!options.originBranch) {
    return false;
  }

  const currentBranch = await git.getCurrentBranch();
  const originBranch: string = options.originBranch;
  const pattern = `TASKS/task-${options.taskId}-*.md`;
  const assetsPattern = `TASKS/assets/task-${options.taskId}/`;

  const coResult = await git.checkoutBranch(originBranch);
  if (!coResult) {
    await git.checkoutBranch(currentBranch);
    return false;
  }

  try {
    const patternsToAdd: string[] = [];

    const fileOk = await git.checkoutFile(options.defaultBranch, pattern);
    if (fileOk) {
      patternsToAdd.push(pattern);
    }

    const assetsOk = await git.checkoutFile(options.defaultBranch, assetsPattern);
    if (assetsOk) {
      patternsToAdd.push(assetsPattern);
    }

    if (patternsToAdd.length === 0) {
      await git.checkoutBranch(currentBranch);
      return false;
    }

    const combinedPattern = patternsToAdd.join(' ');
    const addOk = await git.addFiles(combinedPattern);
    if (!addOk) {
      await git.checkoutBranch(currentBranch);
      return false;
    }

    const message = `docs(TASKS): task-${options.taskId} - done [skip-ci]`;
    const commitOk = await git.commit(message);
    if (!commitOk) {
      await git.checkoutBranch(currentBranch);
      return false;
    }

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        await safeCall(() => git.fetch());
        await safeCall(() => git.rebase(`origin/${originBranch}`));
      }

      const pushOk = await safeCall(() => git.push(originBranch));
      if (pushOk === true) {
        await git.checkoutBranch(currentBranch);
        return true;
      }

      if (attempt >= MAX_RETRY_ATTEMPTS) {
        await git.checkoutBranch(currentBranch);
        throw new Error(`Squash push rejected after ${MAX_RETRY_ATTEMPTS} retries.`);
      }
    }

    await git.checkoutBranch(currentBranch);
    throw new Error(`Squash push rejected after ${MAX_RETRY_ATTEMPTS} retries.`);
  } catch (error: unknown) {
    await git.checkoutBranch(currentBranch);
    if (error instanceof Error) {
      throw error;
    }
    return false;
  }
}
