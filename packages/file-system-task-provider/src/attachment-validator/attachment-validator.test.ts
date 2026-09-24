import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ATTACHMENT_EXCEPTIONS_FILE_NAME, AttachmentValidator } from './index';

const KB = 1024;
const MAX_KB = 300;
const REASON = 'predates the 300 KB limit (2026-09-23)';

let root: string;
let tasksDir: string;
let taskinDir: string;

const validator = () => new AttachmentValidator({ maxAttachmentKb: MAX_KB, taskinDir, tasksDir });

function attachment(relative: string, bytes: number): void {
  const target = join(tasksDir, relative);
  mkdirSync(join(target, '..'), { recursive: true });
  writeFileSync(target, Buffer.alloc(bytes, 1));
}

function exceptions(content: unknown): void {
  mkdirSync(taskinDir, { recursive: true });
  writeFileSync(
    join(taskinDir, ATTACHMENT_EXCEPTIONS_FILE_NAME),
    typeof content === 'string' ? content : JSON.stringify(content),
  );
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'taskin-attachments-'));
  tasksDir = join(root, 'TASKS');
  taskinDir = join(root, '.taskin');
  mkdirSync(tasksDir, { recursive: true });
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('the limit', () => {
  it('reports the attachment over it, with the reduction hint as the suggestion', async () => {
    attachment('assets/flight.gif', 3_500 * KB);

    const [issue, ...rest] = await validator().validate();

    expect(rest).toEqual([]);
    expect(issue?.severity).toBe('error');
    expect(issue?.message).toContain('assets/flight.gif');
    expect(issue?.suggestion).toContain('tile=');
  });

  it('looks into subdirectories', async () => {
    attachment('assets/task-010/deep/flight.webm', 400 * KB);

    expect(await validator().validate()).toHaveLength(1);
  });

  it('markdown is not an attachment', async () => {
    writeFileSync(join(tasksDir, 'task-001-x.md'), 'x'.repeat(400 * KB));
    mkdirSync(join(tasksDir, 'plans'));
    writeFileSync(join(tasksDir, 'plans', 'plan.md'), 'x'.repeat(400 * KB));

    expect(await validator().validate()).toEqual([]);
  });

  it('without a tasks directory, it has no opinion', async () => {
    rmSync(tasksDir, { recursive: true });

    expect(await validator().validate()).toEqual([]);
  });
});

describe('the exceptions', () => {
  it('a registered attachment passes, up to the registered size', async () => {
    attachment('assets/old.png', 2_000 * KB);
    exceptions({ exceptions: { 'assets/old.png': { bytes: 2_000 * KB, reason: REASON } } });

    expect(await validator().validate()).toEqual([]);
  });

  it('a registered attachment that grew fails — the exception pins today’s size', async () => {
    attachment('assets/old.png', 2_100 * KB);
    exceptions({ exceptions: { 'assets/old.png': { bytes: 2_000 * KB, reason: REASON } } });

    const [issue] = await validator().validate();

    expect(issue?.severity).toBe('error');
    expect(issue?.message).toMatch(/grew/i);
    expect(issue?.suggestion).toContain('palettegen');
  });

  it('growth smaller than a KB still reads as growth — the message falls back to bytes', async () => {
    attachment('assets/old.png', 2_000 * KB + 1);
    exceptions({ exceptions: { 'assets/old.png': { bytes: 2_000 * KB, reason: REASON } } });

    const [issue] = await validator().validate();

    expect(issue?.message).toContain(`${2_000 * KB} bytes`);
    expect(issue?.message).toContain(`${2_000 * KB + 1} bytes`);
  });

  it('an entry whose file is gone fails, asking for the entry to be removed', async () => {
    exceptions({ exceptions: { 'assets/deleted.png': { bytes: 2_000 * KB, reason: REASON } } });

    const [issue] = await validator().validate();

    expect(issue?.severity).toBe('error');
    expect(issue?.file).toContain(ATTACHMENT_EXCEPTIONS_FILE_NAME);
    expect(issue?.message).toContain('assets/deleted.png');
    expect(issue?.suggestion).toMatch(/remove the entry/i);
  });

  it('an entry whose file already fits fails — a forgotten exception covers the next heavy file', async () => {
    attachment('assets/reduced.png', 130 * KB);
    exceptions({ exceptions: { 'assets/reduced.png': { bytes: 2_000 * KB, reason: REASON } } });

    const [issue] = await validator().validate();

    expect(issue?.message).toMatch(/already fits/i);
    expect(issue?.suggestion).toMatch(/remove the entry/i);
  });

  it('an entry without a reason fails', async () => {
    attachment('assets/old.png', 2_000 * KB);
    exceptions({ exceptions: { 'assets/old.png': { bytes: 2_000 * KB } } });

    const [issue] = await validator().validate();

    expect(issue?.message).toMatch(/reason/i);
  });

  it('an unreadable exceptions file fails, instead of silently exempting everything or nothing', async () => {
    attachment('assets/old.png', 2_000 * KB);
    exceptions('{ this is not json');

    const issues = await validator().validate();

    expect(issues.some((i) => i.file.includes(ATTACHMENT_EXCEPTIONS_FILE_NAME))).toBe(true);
    expect(issues.some((i) => i.message.includes('assets/old.png'))).toBe(true);
  });
});

describe('what lint --fix can do about it', () => {
  it('marks every issue as not fixable — no rewrite makes a file smaller or writes a reason', async () => {
    attachment('assets/big.png', 2_000 * KB);
    attachment('assets/grew.png', 2_000 * KB);
    attachment('assets/fits.png', 10 * KB);
    exceptions({
      exceptions: {
        'assets/grew.png': { bytes: 1_000 * KB, reason: REASON },
        'assets/fits.png': { bytes: 10 * KB, reason: REASON },
        'assets/gone.png': { bytes: 10 * KB },
      },
    });

    const issues = await validator().validate();

    expect(issues.length).toBeGreaterThanOrEqual(4);
    expect(issues.every((issue) => issue.fixable === false)).toBe(true);
  });
});
