import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemTaskProvider } from './file-system-task-provider';
import { UserRegistry } from './user-registry';
import { PARKED_USERS_FILE_NAME, TASKIN_DIR_NAME, USERS_FILE_NAME } from './users-file-location';

let projectRoot: string;
let tasksDir: string;

function makeProvider(): FileSystemTaskProvider {
  return new FileSystemTaskProvider(tasksDir, new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) }));
}

function writeLegacy(id: string): void {
  writeFileSync(
    join(projectRoot, USERS_FILE_NAME),
    JSON.stringify({ users: { [id]: { id, name: id, email: `${id}@example.com` } } }, null, 2),
    'utf-8',
  );
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-provider-users-'));
  tasksDir = join(projectRoot, 'TASKS');
  mkdirSync(tasksDir, { recursive: true });
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('FileSystemTaskProvider.initialize', () => {
  it('seeds the registry inside .taskin/, where the UserRegistry reads it', async () => {
    await makeProvider().initialize();

    expect(existsSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME))).toBe(true);
    expect(existsSync(join(projectRoot, USERS_FILE_NAME))).toBe(false);
  });

  it('migrates a root registry left behind by an older version instead of seeding a new one', async () => {
    writeLegacy('ana');

    await makeProvider().initialize();

    expect(existsSync(join(projectRoot, USERS_FILE_NAME))).toBe(false);
    const registry = new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) });
    await registry.load();
    expect(registry.getUser('ana')).toEqual({ id: 'ana', name: 'ana', email: 'ana@example.com' });
  });

  it('creates the tasks directory it was given, not TASKS/ under the cwd', async () => {
    const custom = join(projectRoot, 'issues');
    const provider = new FileSystemTaskProvider(
      custom,
      new UserRegistry({ taskinDir: join(projectRoot, TASKIN_DIR_NAME) }),
    );

    await provider.initialize();

    expect(existsSync(custom)).toBe(true);
  });
});

describe('FileSystemTaskProvider.lint', () => {
  it('fails lint when the registry sits at the project root', async () => {
    writeLegacy('ana');

    const result = await makeProvider().lint();

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes('project root'))).toBe(true);
    expect(existsSync(join(projectRoot, USERS_FILE_NAME))).toBe(true);
  });

  it('moves the registry with --fix and then passes', async () => {
    writeLegacy('ana');
    const provider = makeProvider();

    const fixed = await provider.lint(true);
    expect(fixed.issues.some((issue) => issue.severity === 'info')).toBe(true);
    expect(existsSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME))).toBe(true);

    const afterFix = await provider.lint();
    expect(afterFix.valid).toBe(true);
    expect(afterFix.issues).toEqual([]);
  });

  it('parks a shadowed root registry with --fix, keeping the canonical one intact', async () => {
    writeLegacy('developer');
    mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
    writeFileSync(
      join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME),
      JSON.stringify({ users: { ana: { id: 'ana', name: 'Ana', email: 'ana@example.com' } } }, null, 2),
      'utf-8',
    );

    await makeProvider().lint(true);

    const canonical = JSON.parse(readFileSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME), 'utf-8'));
    expect(Object.keys(canonical.users)).toEqual(['ana']);
    expect(existsSync(join(projectRoot, TASKIN_DIR_NAME, PARKED_USERS_FILE_NAME))).toBe(true);
  });

  it('stays quiet on a project whose registry is already in the right place', async () => {
    mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
    writeFileSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME), JSON.stringify({ users: {} }), 'utf-8');

    const result = await makeProvider().lint();

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});
