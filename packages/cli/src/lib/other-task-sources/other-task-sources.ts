import { detectDefaultBranch, listLocalTaskSources, type TaskSource } from '@opentask/taskin-git-utils';
import type { Task } from '@opentask/taskin-types';
import path from 'path';
import type { MergedTaskSources, SourcedTask } from './other-task-sources.types';

export function sourceLabel(source: TaskSource): string {
  return source.kind === 'ref' ? source.ref : `worktree ${source.branch ?? 'detached'} (${source.path})`;
}

/**
 * Combines the current worktree's tasks with those read elsewhere.
 *
 * The current worktree is what the person works on, so its tasks stay as
 * they are; the others only add what is missing here. When the same id says
 * something else in the source of highest precedence, a notice says so
 * instead of picking silently: per task-135, the default branch holds the
 * shared status.
 */
export function mergeOtherTasks(local: readonly Task[], others: readonly SourcedTask[]): MergedTaskSources {
  const localById = new Map(local.map((t) => [String(t.id), t]));
  const firstById = new Map<string, SourcedTask>();
  for (const other of others) {
    const id = String(other.task.id);
    if (!firstById.has(id)) firstById.set(id, other);
  }

  const extra: SourcedTask[] = [];
  const notices: string[] = [];
  for (const [id, other] of firstById) {
    const here = localById.get(id);
    if (!here) {
      extra.push(other);
      continue;
    }
    const hereFile = 'filePath' in here && typeof here.filePath === 'string' ? path.basename(here.filePath) : '';
    if (hereFile !== '' && hereFile !== other.fileName) {
      notices.push(
        `task-${id}: number used by two files, ${hereFile} here and ${other.fileName} in ${sourceLabel(other.source)}`,
      );
    } else if (here.status !== other.task.status) {
      notices.push(`task-${id}: ${here.status} here, ${other.task.status} in ${sourceLabel(other.source)}`);
    }
  }

  return { extra, notices };
}

/** What the file system provider offers for reading other sources. */
interface TaskFileReader {
  getTasksDirectory(): string;
  parseTaskFile(fileName: string, content: string, filePath?: string): Task | undefined;
}

function isTaskFileReader(provider: unknown): provider is TaskFileReader {
  const p = provider as Partial<TaskFileReader> | null;
  return typeof p?.getTasksDirectory === 'function' && typeof p?.parseTaskFile === 'function';
}

export interface ReadOtherTasksOptions {
  cwd: string;
  /** Configured default branch; without it, detected from local refs. */
  defaultBranch?: string;
  /** Fetch first. Only with autoSync. */
  fetch: boolean;
}

/**
 * The tasks in the other local worktrees and the default branch's local refs.
 *
 * A provider that is not file based has no other worktree to read, and gets
 * nothing here.
 */
export async function readOtherTasks(
  provider: unknown,
  options: ReadOtherTasksOptions,
): Promise<{ tasks: SourcedTask[]; warnings: string[] }> {
  if (!isTaskFileReader(provider)) return { tasks: [], warnings: [] };

  const defaultBranch = options.defaultBranch ?? detectDefaultBranch(options.cwd) ?? undefined;
  const { files, warnings } = await listLocalTaskSources({
    cwd: options.cwd,
    tasksDirectory: provider.getTasksDirectory(),
    ...(defaultBranch && { defaultBranch }),
    fetch: options.fetch,
  });

  const tasks = files.flatMap((file) => {
    const where =
      file.source.kind === 'ref' ? `${file.source.ref}:${file.fileName}` : path.join(file.source.path, file.fileName);
    const task = provider.parseTaskFile(file.fileName, file.content, where);
    return task ? [{ task, fileName: file.fileName, source: file.source }] : [];
  });

  return { tasks, warnings };
}
