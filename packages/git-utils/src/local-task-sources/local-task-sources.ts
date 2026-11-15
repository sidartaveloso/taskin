import { execFileSync, spawnSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'fs';
import { join, relative } from 'path';
import type {
  ListLocalTaskSourcesOptions,
  LocalTaskFile,
  LocalTaskSources,
  TaskSource,
} from './local-task-sources.types';

const TASK_FILE = /^task-[^/]+\.md$/;

interface Worktree {
  path: string;
  branch: string | null;
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
}

function tryGit(cwd: string, args: string[]): string | undefined {
  try {
    return git(cwd, args);
  } catch {
    return undefined;
  }
}

function canonical(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/** `git worktree list --porcelain`: one block per worktree, blank line between. */
function listWorktrees(cwd: string): Worktree[] {
  const output = tryGit(cwd, ['worktree', 'list', '--porcelain']) ?? '';
  return output
    .split(/\n\n+/)
    .map((block) => block.split('\n'))
    .filter((lines) => lines[0]?.startsWith('worktree ') && !lines.includes('bare'))
    .map((lines) => {
      const branchLine = lines.find((l) => l.startsWith('branch '));
      return {
        path: canonical((lines[0] ?? '').slice('worktree '.length)),
        branch: branchLine ? branchLine.slice('branch refs/heads/'.length) : null,
      };
    });
}

function readWorktree(worktree: Worktree, tasksRelative: string): LocalTaskFile[] {
  const dir = join(worktree.path, tasksRelative);
  if (!existsSync(dir)) return [];
  const source: TaskSource = { kind: 'worktree', path: worktree.path, branch: worktree.branch };
  return readdirSync(dir)
    .filter((name) => TASK_FILE.test(name))
    .sort()
    .map((fileName) => ({ fileName, content: readFileSync(join(dir, fileName), 'utf8'), source }));
}

/**
 * Lists a ref's task files with `ls-tree` and reads them all in one
 * `cat-file --batch`, instead of one `git show` per file.
 */
function readRef(cwd: string, ref: string, tasksRelative: string): LocalTaskFile[] {
  const prefix = tasksRelative === '' ? '' : `${tasksRelative}/`;
  const listing = tryGit(cwd, ['ls-tree', '--name-only', ref, '--', prefix]);
  if (!listing) return [];
  const fileNames = listing
    .split('\n')
    .map((p) => p.slice(prefix.length))
    .filter((name) => TASK_FILE.test(name))
    .sort();
  if (fileNames.length === 0) return [];

  const batch = spawnSync('git', ['cat-file', '--batch'], {
    cwd,
    input: `${fileNames.map((name) => `${ref}:${prefix}${name}`).join('\n')}\n`,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (batch.status !== 0) return [];

  const out = batch.stdout;
  const files: LocalTaskFile[] = [];
  let offset = 0;
  for (const fileName of fileNames) {
    const headerEnd = out.indexOf(0x0a, offset);
    if (headerEnd < 0) break;
    const header = out.subarray(offset, headerEnd).toString('utf8').split(' ');
    offset = headerEnd + 1;
    if (header[1] !== 'blob') continue;
    const size = Number(header[2]);
    files.push({
      fileName,
      content: out.subarray(offset, offset + size).toString('utf8'),
      source: { kind: 'ref', ref },
    });
    offset += size + 1;
  }
  return files;
}

function refExists(cwd: string, fullRef: string): boolean {
  return tryGit(cwd, ['rev-parse', '--verify', '--quiet', fullRef]) !== undefined;
}

/**
 * Task files this machine already has outside the current worktree: the
 * other local worktrees and the local refs of the default branch.
 *
 * Without `fetch`, nothing touches the network: `origin/<defaultBranch>` is
 * read as of the last fetch or push. Outside a git repository there is
 * nothing to add, and the result is empty.
 */
export async function listLocalTaskSources(options: ListLocalTaskSourcesOptions): Promise<LocalTaskSources> {
  const { cwd, defaultBranch } = options;
  const topLevel = tryGit(cwd, ['rev-parse', '--show-toplevel'])?.trim();
  if (!topLevel) return { files: [], warnings: [] };

  const warnings: string[] = [];
  const current = canonical(topLevel);
  const tasksRelative = relative(current, canonical(options.tasksDirectory)).split('\\').join('/');

  if (options.fetch && defaultBranch) {
    const fetched = spawnSync('git', ['fetch', '--quiet', 'origin', defaultBranch], { cwd, encoding: 'utf8' });
    if (fetched.status !== 0) {
      const reason = (fetched.stderr || fetched.error?.message || '').trim().split('\n')[0];
      warnings.push(
        `git fetch origin ${defaultBranch} failed; using what is on this machine${reason ? `: ${reason}` : ''}`,
      );
    }
  }

  const others = listWorktrees(cwd).filter((w) => w.path !== current && existsSync(w.path));
  const onDefault = others.filter((w) => defaultBranch !== undefined && w.branch === defaultBranch);
  const rest = others.filter((w) => !onDefault.includes(w));

  const refs = defaultBranch
    ? [
        { ref: defaultBranch, full: `refs/heads/${defaultBranch}` },
        { ref: `origin/${defaultBranch}`, full: `refs/remotes/origin/${defaultBranch}` },
      ].filter((r) => refExists(cwd, r.full))
    : [];

  const files = [
    ...onDefault.flatMap((w) => readWorktree(w, tasksRelative)),
    ...refs.flatMap((r) => readRef(cwd, r.ref, tasksRelative)),
    ...rest.flatMap((w) => readWorktree(w, tasksRelative)),
  ];

  return { files, warnings };
}
