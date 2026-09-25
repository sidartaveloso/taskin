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

describe('validateUsersFileLocation — arquivo estacionado', () => {
  it('reminds about a parked legacy registry, so it does not sit there forever', async () => {
    writeCanonical('ana');
    mkdirSync(join(projectRoot, TASKIN_DIR_NAME), { recursive: true });
    writeFileSync(join(projectRoot, TASKIN_DIR_NAME, PARKED_USERS_FILE_NAME), usersJson('developer'), 'utf-8');

    const [issue, ...rest] = await validateUsersFileLocation(projectRoot);

    expect(rest).toEqual([]);
    expect(issue?.severity).toBe('info');
    expect(issue?.file).toContain(PARKED_USERS_FILE_NAME);
    expect(issue?.suggestion).toBeDefined();
  });

  it('stays quiet when there is nothing parked', async () => {
    writeCanonical('ana');

    expect(await validateUsersFileLocation(projectRoot)).toEqual([]);
  });
});

function indexStatus(): string {
  return execSync('git status --porcelain --untracked-files=all', { cwd: projectRoot }).toString();
}

function statusOf(file: string): string | undefined {
  return indexStatus()
    .split('\n')
    .find((line) => line.slice(3) === file)
    ?.slice(0, 2);
}

describe('migracao 3.x → 4.x no caso both — o estado final do indice do Git', () => {
  const legacyName = USERS_FILE_NAME;
  const canonicalName = join(TASKIN_DIR_NAME, USERS_FILE_NAME);
  const parkedName = join(TASKIN_DIR_NAME, PARKED_USERS_FILE_NAME);

  beforeEach(() => {
    initRepo();
    writeLegacy('developer');
    commitAll('registro na raiz, como no taskin 3.x');
    writeCanonical('ana');
  });

  it('stages the root removal together with the canonical registry, and leaves the parked copy out of the index', async () => {
    const result = await fixUsersFileLocation(projectRoot);

    expect(result).toMatchObject({ action: 'parked', viaGit: true });
    expect(statusOf(legacyName)).toBe('D ');
    expect(statusOf(canonicalName)).toBe('A ');
    expect(statusOf(parkedName)).toBe('??');
  });

  it('following the lint to the letter commits the canonical registry in place of the root one', async () => {
    await fixUsersFileLocation(projectRoot);
    rmSync(join(projectRoot, parkedName));
    execSync('git commit -m "migra o registro de usuarios"', { cwd: projectRoot, stdio: 'ignore' });

    const tree = execSync('git ls-tree -r --name-only HEAD', { cwd: projectRoot }).toString().split('\n');
    expect(tree).toContain(canonicalName);
    expect(tree).not.toContain(legacyName);
    expect(indexStatus()).toBe('');
  });

  it('lets git follow the history when the contents are alike, since the rename is inferred from that commit', async () => {
    writeFileSync(join(projectRoot, canonicalName), readFileSync(join(projectRoot, legacyName)));

    await fixUsersFileLocation(projectRoot);

    const staged = execSync('git diff --cached --name-status -M', { cwd: projectRoot }).toString();
    expect(staged).toMatch(new RegExp(`^R\\d+\\s+${legacyName.replace('.', '\\.')}\\s+${TASKIN_DIR_NAME}/`, 'm'));
  });

  it('does not add a canonical registry that .gitignore excludes', async () => {
    writeFileSync(join(projectRoot, '.gitignore'), `${canonicalName}\n`);

    const result = await fixUsersFileLocation(projectRoot);

    expect(result.viaGit).toBe(true);
    expect(statusOf(legacyName)).toBe('D ');
    expect(indexStatus()).not.toContain(canonicalName);
    expect(existsSync(join(projectRoot, canonicalName))).toBe(true);
  });

  it('touches no index when the root file was never tracked', async () => {
    execSync(`git rm --cached --quiet -- ${legacyName}`, { cwd: projectRoot });
    execSync('git commit -m "tira da raiz"', { cwd: projectRoot, stdio: 'ignore' });

    const result = await fixUsersFileLocation(projectRoot);

    expect(result).toMatchObject({ action: 'parked', viaGit: false });
    expect(statusOf(canonicalName)).toBe('??');
    expect(existsSync(join(projectRoot, parkedName))).toBe(true);
  });

  it('tells, for the parked copy, what to do with Git and not only with the content', async () => {
    await fixUsersFileLocation(projectRoot);

    const parked = (await validateUsersFileLocation(projectRoot)).find((issue) =>
      issue.file.endsWith(PARKED_USERS_FILE_NAME),
    );

    expect(parked?.suggestion).toContain(`rm ${parkedName}`);
    expect(parked?.suggestion).not.toContain('git rm');
    expect(parked?.suggestion).toContain(`git add ${canonicalName}`);
    expect(parked?.suggestion).toContain('same commit');
  });
});

describe('validateUsersFileLocation — registro canonico fora do Git', () => {
  it('warns when the canonical registry exists but is not tracked in a git project', async () => {
    initRepo();
    const canonical = writeCanonical('ana');

    const issues = await validateUsersFileLocation(projectRoot);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ file: canonical, severity: 'warning' });
    expect(issues[0]?.suggestion).toContain(`git add ${join(TASKIN_DIR_NAME, USERS_FILE_NAME)}`);
  });

  it('stays quiet once the registry is committed', async () => {
    initRepo();
    writeCanonical('ana');
    commitAll('registro');

    expect(await validateUsersFileLocation(projectRoot)).toEqual([]);
  });

  it('stays quiet on a project without git — that is a legitimate setup', async () => {
    writeCanonical('ana');

    expect(await validateUsersFileLocation(projectRoot)).toEqual([]);
  });

  it('stays quiet when .gitignore excludes the registry on purpose', async () => {
    initRepo();
    writeFileSync(join(projectRoot, '.gitignore'), `${TASKIN_DIR_NAME}/\n`);
    writeCanonical('ana');

    expect(await validateUsersFileLocation(projectRoot)).toEqual([]);
  });

  it('points at an untracked canonical alongside a stale root file, before any fix', async () => {
    initRepo();
    writeLegacy('developer');
    writeCanonical('ana');

    const severities = (await validateUsersFileLocation(projectRoot)).map((issue) => issue.severity);

    expect(severities).toEqual(['warning', 'warning']);
  });

  it('suggests git rm for a parked copy that an older lint put in the index', async () => {
    initRepo();
    writeCanonical('ana');
    writeFileSync(join(projectRoot, TASKIN_DIR_NAME, PARKED_USERS_FILE_NAME), usersJson('developer'), 'utf-8');
    commitAll('estacionado versionado pelo git mv antigo');

    const [issue] = await validateUsersFileLocation(projectRoot);

    expect(issue?.suggestion).toContain(`git rm ${join(TASKIN_DIR_NAME, PARKED_USERS_FILE_NAME)}`);
  });
});
