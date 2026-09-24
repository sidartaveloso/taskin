import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FileSystemTaskProviderOptions } from './file-system-task-provider';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { TASKIN_DIR_NAME } from './users-file-location';

/*
 * The per-attachment size limit (task-108). Attachments — the evidence under
 * `TASKS/assets/` — go into git, which keeps forever whatever enters the
 * history: in one project a single video evidence added 16 MB, eight times the
 * whole repository.
 */

const KB = 1024;

let projectRoot: string;
let tasksDir: string;

function makeProvider(options: FileSystemTaskProviderOptions = {}): FileSystemTaskProvider {
  return new FileSystemTaskProvider(
    tasksDir,
    new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) }),
    undefined,
    undefined,
    options,
  );
}

function writeAttachment(relative: string, bytes: number): void {
  const target = join(tasksDir, relative);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, Buffer.alloc(bytes, 1));
}

const attachmentIssues = async (provider: FileSystemTaskProvider) =>
  (await provider.lint()).issues.filter((issue) => issue.file.includes(`${join('TASKS', 'assets')}`));

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-provider-attachments-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('FileSystemTaskProvider.lint — per-attachment size limit', () => {
  it('an attachment over the limit fails lint, naming the file and both sizes', async () => {
    writeAttachment('assets/flight.gif', 3_500 * KB);

    const result = await makeProvider({ maxAttachmentKb: 300 }).lint();
    const [issue] = result.issues.filter((i) => i.file.endsWith('flight.gif'));

    expect(result.valid).toBe(false);
    expect(issue?.severity).toBe('error');
    expect(issue?.message).toContain('3500 KB');
    expect(issue?.message).toContain('300 KB');
  });

  it('an attachment within the limit passes', async () => {
    writeAttachment('assets/strip.jpg', 40 * KB);

    expect(await attachmentIssues(makeProvider({ maxAttachmentKb: 300 }))).toEqual([]);
  });

  it('exactly at the limit passes; one byte over does not', async () => {
    writeAttachment('assets/at-limit.png', 300 * KB);
    writeAttachment('assets/one-byte-over.png', 300 * KB + 1);

    const issues = await attachmentIssues(makeProvider({ maxAttachmentKb: 300 }));

    expect(issues.map((i) => i.file.split('/').pop())).toEqual(['one-byte-over.png']);
  });

  it('without maxAttachmentKb there is no limit — upgrading taskin does not start failing anyone', async () => {
    writeAttachment('assets/flight.webm', 5_000 * KB);

    expect(await attachmentIssues(makeProvider())).toEqual([]);
  });

  it('the task file itself is not an attachment', async () => {
    writeFileSync(
      join(tasksDir, 'task-001-big.md'),
      `# 🧩 Task 001 — big\n\n- Status: pending\n- Type: feat\n- Assignee: A definir\n\n## Description\n${'x'.repeat(400 * KB)}\n`,
    );

    const issues = (await makeProvider({ maxAttachmentKb: 300 }).lint()).issues;

    expect(issues.filter((i) => i.message.includes('KB'))).toEqual([]);
  });
});
