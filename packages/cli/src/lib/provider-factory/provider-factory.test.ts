import type { ITaskProvider, IUserRegistry } from '@opentask/taskin-task-manager';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROVIDER_BUILDERS, resolveTaskProvider } from './provider-factory';
import type { OpaqueTask, ProviderBuilder } from './provider-factory.types';

let projectRoot: string;

function writeConfig(provider: { type: string; config?: Record<string, unknown> }): void {
  writeFileSync(
    join(projectRoot, '.taskin.json'),
    JSON.stringify({ version: '1.0.0', provider: { config: {}, ...provider } }, null, 2),
    'utf-8',
  );
}

function fakeRegistry(): IUserRegistry {
  return {
    load: vi.fn().mockResolvedValue(undefined),
    getUser: vi.fn(),
    resolveUser: vi.fn(),
    ensureCurrentUser: vi.fn(),
    createTemporaryUser: vi.fn(),
    getAllUsers: vi.fn().mockReturnValue([]),
    saveUser: vi.fn(),
  } as unknown as IUserRegistry;
}

function fakeBuilder(): { builder: ProviderBuilder; seen: { context?: unknown } } {
  const seen: { context?: unknown } = {};
  const builder: ProviderBuilder = async (context) => {
    seen.context = context;
    return {
      provider: {} as ITaskProvider<OpaqueTask>,
      userRegistry: fakeRegistry(),
    };
  };
  return { builder, seen };
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'taskin-provider-factory-'));
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
  delete process.env.TASKIN_TEST_TOKEN;
});

describe('resolveTaskProvider', () => {
  it('builds the provider named by provider.type, not a hardcoded one', async () => {
    writeConfig({ type: 'fake' });
    const { builder, seen } = fakeBuilder();
    const fsBuilder = vi.fn();

    const bundle = await resolveTaskProvider({ cwd: projectRoot }, { fake: builder, fs: fsBuilder });

    expect(bundle.providerType).toBe('fake');
    expect(seen.context).toBeDefined();
    expect(fsBuilder).not.toHaveBeenCalled();
  });

  it('loads the user registry, so no caller has to remember to', async () => {
    writeConfig({ type: 'fake' });
    const registry = fakeRegistry();
    const builder: ProviderBuilder = async () => ({
      provider: {} as ITaskProvider<OpaqueTask>,
      userRegistry: registry,
    });

    await resolveTaskProvider({ cwd: projectRoot }, { fake: builder });

    expect(registry.load).toHaveBeenCalledOnce();
  });

  // biome-ignore lint/suspicious/noTemplateCurlyInString: literal ${VAR} placeholder consumed by resolveEnvVars
  it('expands the ${VAR} placeholder in the provider config, so no secret has to be committed', async () => {
    process.env.TASKIN_TEST_TOKEN = 'ghp_from_env';
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal ${VAR} placeholder consumed by resolveEnvVars
    writeConfig({ type: 'fake', config: { token: '${TASKIN_TEST_TOKEN}', owner: 'acme', retries: 3 } });
    const { builder, seen } = fakeBuilder();

    await resolveTaskProvider({ cwd: projectRoot }, { fake: builder });

    expect(seen.context).toMatchObject({
      providerConfig: { token: 'ghp_from_env', owner: 'acme', retries: 3 },
    });
  });

  it('passes the tasks-directory override through to the builder', async () => {
    writeConfig({ type: 'fake', config: { tasksDir: 'TASKS' } });
    const { builder, seen } = fakeBuilder();

    await resolveTaskProvider({ cwd: projectRoot, tasksDir: 'ISSUES' }, { fake: builder });

    expect(seen.context).toMatchObject({ tasksDirOverride: 'ISSUES' });
  });

  it('explains a provider that is listed but not implemented, instead of failing on an import', async () => {
    writeConfig({ type: 'github' });

    await expect(resolveTaskProvider({ cwd: projectRoot })).rejects.toThrow(/no implementation yet/);
    await expect(resolveTaskProvider({ cwd: projectRoot })).rejects.toThrow(/taskin-github-provider/);
  });

  it('lists what is usable when provider.type is unknown', async () => {
    writeConfig({ type: 'sharepoint' });

    await expect(resolveTaskProvider({ cwd: projectRoot })).rejects.toThrow(/Unknown provider\.type "sharepoint"/);
    await expect(resolveTaskProvider({ cwd: projectRoot })).rejects.toThrow(/Usable now: fs/);
  });

  it('points at init when there is no .taskin.json', async () => {
    await expect(resolveTaskProvider({ cwd: projectRoot })).rejects.toThrow(/taskin init/);
  });
});

describe('PROVIDER_BUILDERS.fs', () => {
  it('resolves tasksDir from the provider config and the registry from .taskin/', async () => {
    mkdirSync(join(projectRoot, 'TASKS'), { recursive: true });
    mkdirSync(join(projectRoot, '.taskin'), { recursive: true });
    writeFileSync(
      join(projectRoot, '.taskin', '.taskin-users.json'),
      JSON.stringify({ users: { ana: { id: 'ana', name: 'Ana', email: 'ana@example.com' } } }),
      'utf-8',
    );
    writeConfig({ type: 'fs', config: { tasksDir: 'TASKS' } });

    const { userRegistry, providerType } = await resolveTaskProvider({ cwd: projectRoot }, PROVIDER_BUILDERS);

    expect(providerType).toBe('fs');
    // Resolvido de .taskin/.taskin-users.json — o `list` lia da raiz do projeto
    expect(userRegistry.getUser('ana')).toEqual({ id: 'ana', name: 'Ana', email: 'ana@example.com' });
  });

  it('reads tasks from the directory the override names', async () => {
    const issues = join(projectRoot, 'ISSUES');
    mkdirSync(issues, { recursive: true });
    writeFileSync(
      join(issues, 'task-007-alvo.md'),
      '# Task 007 — Alvo\n\nStatus: pending\nType: feat\nAssignee: ana\n\n## Description\n\nx\n',
      'utf-8',
    );
    writeConfig({ type: 'fs', config: { tasksDir: 'TASKS' } });

    const { provider } = await resolveTaskProvider({ cwd: projectRoot, tasksDir: 'ISSUES' }, PROVIDER_BUILDERS);
    const tasks = await provider.getAllTasks();

    expect(tasks.map((task) => task.id)).toEqual(['007']);
  });
});
