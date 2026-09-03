import { execSync } from 'child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  fixUsersFileLocation,
  inspectUsersFileLocation,
  PARKED_USERS_FILE_NAME,
  resolveUsersFilePaths,
  TASKIN_DIR_NAME,
  USERS_FILE_NAME,
  validateUsersFileLocation,
} from './users-file-location';

let projectRoot: string;

function usersJson(id: string): string {
  return JSON.stringify({ users: { [id]: { id, name: id, email: `${id}@example.com` } } }, null, 2);
}

function writeLegacy(id: string): string {
  const filePath = join(projectRoot, USERS_FILE_NAME);
  writeFileSync(filePath, usersJson(id), 'utf-8');
  return filePath;
}

function writeCanonical(id: string): string {
  const filePath = join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME);
  mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
  writeFileSync(filePath, usersJson(id), 'utf-8');
  return filePath;
}

function initRepo(): void {
  execSync('git init', { cwd: projectRoot, stdio: 'ignore' });
  execSync('git config user.email "test@taskin.dev"', { cwd: projectRoot, stdio: 'ignore' });
  execSync('git config user.name "Taskin Test"', { cwd: projectRoot, stdio: 'ignore' });
}

function commitAll(message: string): void {
  execSync('git add -A', { cwd: projectRoot, stdio: 'ignore' });
  execSync(`git commit -m "${message}"`, { cwd: projectRoot, stdio: 'ignore' });
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-users-location-'));
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('resolveUsersFilePaths', () => {
  it('reads the registry from inside .taskin/, not from the project root', () => {
    const paths = resolveUsersFilePaths(projectRoot);

    expect(paths.canonical).toBe(join(projectRoot, '.taskin', '.taskin-users.json'));
    expect(paths.legacy).toBe(join(projectRoot, '.taskin-users.json'));
    expect(paths.parked).toBe(join(projectRoot, '.taskin', '.taskin-users.legacy.json'));
  });
});

describe('inspectUsersFileLocation', () => {
  it('reports missing on a project with no registry', async () => {
    expect(await inspectUsersFileLocation(projectRoot)).toBe('missing');
  });

  it('reports canonical when the registry is in .taskin/', async () => {
    writeCanonical('ana');
    expect(await inspectUsersFileLocation(projectRoot)).toBe('canonical');
  });

  it('reports legacy when the registry is only at the project root', async () => {
    writeLegacy('ana');
    expect(await inspectUsersFileLocation(projectRoot)).toBe('legacy');
  });

  it('reports both when the stale root file survived alongside the canonical one', async () => {
    writeLegacy('developer');
    writeCanonical('ana');
    expect(await inspectUsersFileLocation(projectRoot)).toBe('both');
  });
});

describe('validateUsersFileLocation', () => {
  it('says nothing about a project with no registry', async () => {
    expect(await validateUsersFileLocation(projectRoot)).toEqual([]);
  });

  it('says nothing when the registry is already canonical', async () => {
    writeCanonical('ana');
    expect(await validateUsersFileLocation(projectRoot)).toEqual([]);
  });

  it('errors on a root-only registry, since no assignee resolves', async () => {
    const legacy = writeLegacy('ana');

    const [issue, ...rest] = await validateUsersFileLocation(projectRoot);

    expect(rest).toEqual([]);
    expect(issue?.severity).toBe('error');
    expect(issue?.file).toBe(legacy);
    expect(issue?.message).toContain('project root');
  });

  it('warns — not errors — on a shadowed root registry, because the canonical one works', async () => {
    writeLegacy('developer');
    writeCanonical('ana');

    const [issue] = await validateUsersFileLocation(projectRoot);

    expect(issue?.severity).toBe('warning');
    expect(issue?.message).toContain('never read');
  });

  it('does not write anything: the analyzer only describes', async () => {
    writeLegacy('ana');

    await validateUsersFileLocation(projectRoot);

    expect(existsSync(join(projectRoot, USERS_FILE_NAME))).toBe(true);
    expect(existsSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME))).toBe(false);
  });
});

describe('fixUsersFileLocation', () => {
  it('does nothing when there is no registry', async () => {
    expect(await fixUsersFileLocation(projectRoot)).toEqual({ action: 'none', viaGit: false });
  });

  it('does nothing when the registry is already canonical', async () => {
    writeCanonical('ana');
    expect(await fixUsersFileLocation(projectRoot)).toEqual({ action: 'none', viaGit: false });
  });

  it('promotes a root-only registry, content untouched, creating .taskin/', async () => {
    writeLegacy('ana');

    const result = await fixUsersFileLocation(projectRoot);

    expect(result.action).toBe('moved');
    expect(existsSync(join(projectRoot, USERS_FILE_NAME))).toBe(false);
    const moved = JSON.parse(readFileSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME), 'utf-8'));
    expect(moved.users.ana).toEqual({ id: 'ana', name: 'ana', email: 'ana@example.com' });
    expect(await inspectUsersFileLocation(projectRoot)).toBe('canonical');
  });

  it('falls back to a plain rename outside a git repository', async () => {
    writeLegacy('ana');

    const result = await fixUsersFileLocation(projectRoot);

    expect(result.viaGit).toBe(false);
    expect(existsSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME))).toBe(true);
  });

  it('uses git mv for a tracked file, leaving the rename staged', async () => {
    initRepo();
    writeLegacy('ana');
    commitAll('add legacy users file');

    const result = await fixUsersFileLocation(projectRoot);

    expect(result.viaGit).toBe(true);
    const staged = execSync('git diff --cached --name-status -M', { cwd: projectRoot }).toString();
    expect(staged).toMatch(/^R/m);
    expect(staged).toContain(join(TASKIN_DIR_NAME, USERS_FILE_NAME));
  });

  it('renames instead of git mv when the file is untracked in a git repository', async () => {
    initRepo();
    writeFileSync(join(projectRoot, 'README.md'), '# repo');
    commitAll('initial');
    writeLegacy('ana');

    const result = await fixUsersFileLocation(projectRoot);

    expect(result.viaGit).toBe(false);
    expect(existsSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME))).toBe(true);
  });

  it('parks the stale root file and never overwrites the canonical registry', async () => {
    writeLegacy('developer');
    writeCanonical('ana');

    const result = await fixUsersFileLocation(projectRoot);

    expect(result.action).toBe('parked');
    expect(existsSync(join(projectRoot, USERS_FILE_NAME))).toBe(false);

    const canonical = JSON.parse(readFileSync(join(projectRoot, TASKIN_DIR_NAME, USERS_FILE_NAME), 'utf-8'));
    expect(Object.keys(canonical.users)).toEqual(['ana']);

    const parked = JSON.parse(readFileSync(join(projectRoot, TASKIN_DIR_NAME, PARKED_USERS_FILE_NAME), 'utf-8'));
    expect(Object.keys(parked.users)).toEqual(['developer']);
  });

  it('is idempotent: a second run has nothing left to do', async () => {
    writeLegacy('ana');

    await fixUsersFileLocation(projectRoot);
    const second = await fixUsersFileLocation(projectRoot);

    expect(second).toEqual({ action: 'none', viaGit: false });
  });
});
