import type { User } from '@opentask/taskin-types';
import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  authorNamesNotAttributed,
  buildUser,
  findIdConflict,
  foldId,
  formatUserList,
  resolveAssignees,
  slugifyName,
} from './user.js';

vi.mock('../lib/project-check.js', () => ({ requireTaskinProject: vi.fn() }));

/** Mirrors {@link UserRegistry.resolveUser}: id, then name-slug, then name. */
function resolveFrom(users: User[], nameOrId: string): User | undefined {
  const slug = nameOrId.toLowerCase().replace(/\s+/g, '-');
  return users.find((u) => u.id === nameOrId || u.id === slug || u.name.toLowerCase() === nameOrId.toLowerCase());
}

const state: { users: User[]; tasks: { assignee?: User }[] } = { users: [], tasks: [] };
const registry = {
  get users(): User[] {
    return state.users;
  },
  set users(next: User[]) {
    state.users = next;
  },
  getAllUsers: vi.fn((): User[] => state.users),
  resolveUser: vi.fn((nameOrId: string): User | undefined => resolveFrom(state.users, nameOrId)),
  saveUser: vi.fn(async (user: User): Promise<void> => {
    state.users.push(user);
  }),
};

const provider = {
  getAllTasks: vi.fn(async (): Promise<{ assignee?: User }[]> => state.tasks),
};

vi.mock('../lib/provider-factory/index.js', () => ({
  resolveTaskProvider: vi.fn(async () => ({
    provider,
    userRegistry: registry,
    projectRoot: '/tmp/taskin-test',
    providerType: 'fs',
  })),
}));

/**
 * Pure helpers first: the id a name folds onto, and the duplicate guard, are the
 * decisions that keep `add` from fabricating a second entry for a person who is
 * already registered. They are tested without touching the filesystem.
 */
describe('user registry helpers', () => {
  it('slugifies a display name into the default id', () => {
    expect(slugifyName('Sidarta Veloso')).toBe('sidarta-veloso');
    expect(slugifyName('  Ana  Souza ')).toBe('ana-souza');
  });

  it('folds an id down to letters and digits only', () => {
    expect(foldId('sidarta-veloso')).toBe('sidartaveloso');
    expect(foldId('Bruno Toffoli')).toBe('brunotoffoli');
  });

  it('builds a user, deriving the id from the name when none is given', () => {
    const user = buildUser({ name: 'Ana Souza', email: 'ana@example.com' });
    expect(user).toEqual({ id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' });
  });

  it('honours an explicit id over the derived slug', () => {
    const user = buildUser({ id: 'ana', name: 'Ana Souza', email: 'ana@example.com' });
    expect(user.id).toBe('ana');
  });

  it('rejects an invalid email', () => {
    expect(() => buildUser({ name: 'Ana', email: 'not-an-email' })).toThrow();
  });

  it('finds a conflict on exact id', () => {
    const existing: User[] = [{ id: 'ana', name: 'Ana', email: 'ana@example.com' }];
    expect(findIdConflict(existing, 'ana')?.id).toBe('ana');
  });

  it('finds a conflict when a new id folds onto an existing one', () => {
    const existing: User[] = [{ id: 'sidartaveloso', name: 'Sidarta', email: 's@example.com' }];
    expect(findIdConflict(existing, 'sidarta-veloso')?.id).toBe('sidartaveloso');
  });

  it('reports no conflict for a genuinely new id', () => {
    const existing: User[] = [{ id: 'ana', name: 'Ana', email: 'ana@example.com' }];
    expect(findIdConflict(existing, 'bruno')).toBeUndefined();
  });

  it('formats a list with one row per user carrying id, name and email', () => {
    const rows = formatUserList([
      { id: 'ana', name: 'Ana Souza', email: 'ana@example.com' },
      { id: 'bruno', name: 'Bruno Toffoli', email: 'bruno@example.com' },
    ]);
    const body = rows.join('\n');
    expect(body).toContain('ana');
    expect(body).toContain('Ana Souza');
    expect(body).toContain('ana@example.com');
    expect(body).toContain('bruno@example.com');
  });
});

/**
 * The reporting `add` does after it writes: what the new entry makes resolve, and
 * which commit-author spellings the chosen name leaves off the person. Both are
 * pure over a registry that already holds the new user.
 */
describe('resolveAssignees', () => {
  const ana: User = { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' };
  const registryWith = (
    users: User[],
  ): { resolveUser: (v: string) => User | undefined; getAllUsers: () => User[] } => ({
    resolveUser: (v: string) => resolveFrom(users, v),
    getAllUsers: () => users,
  });

  it('splits in-use spellings into those that now resolve to the new user and those still unknown', () => {
    const result = resolveAssignees(['Ana Souza', 'ana-souza', 'Bruno', 'to be defined'], registryWith([ana]), ana);

    expect(result.nowResolving).toEqual(expect.arrayContaining(['Ana Souza', 'ana-souza']));
    expect(result.stillUnresolved).toEqual(['Bruno']);
  });

  it('counts a spelling that folds onto the new user (correctable) as now resolving', () => {
    const result = resolveAssignees(['anasouza'], registryWith([ana]), ana);
    expect(result.nowResolving).toEqual(['anasouza']);
  });

  it('reports each distinct spelling once', () => {
    const result = resolveAssignees(['Bruno', 'Bruno', ' Bruno '], registryWith([ana]), ana);
    expect(result.stillUnresolved).toEqual(['Bruno']);
  });
});

describe('authorNamesNotAttributed', () => {
  const user: User = { id: 'sidartaveloso', name: 'Sidarta V', email: 's@example.com' };
  const registry = { resolveUser: (v: string) => resolveFrom([user], v) };

  it('flags an author name that folds onto the user but the chosen name does not resolve', () => {
    expect(authorNamesNotAttributed(['Sidarta Veloso', 'Someone Else'], registry, user)).toEqual(['Sidarta Veloso']);
  });

  it('does not flag an author name the chosen name already resolves', () => {
    expect(authorNamesNotAttributed(['Sidarta V'], registry, user)).toEqual([]);
  });
});

/**
 * The command seam is its stdout and the registry it writes to. `add` with every
 * field supplied on the flags takes no interactive prompt, so the test drives it
 * straight through commander.
 */
describe('taskin user command', () => {
  let saida: string[];

  beforeEach(() => {
    saida = [];
    registry.users = [];
    state.tasks = [];
    registry.getAllUsers.mockClear();
    registry.saveUser.mockClear();
    registry.resolveUser.mockClear();
    provider.getAllTasks.mockClear();
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      saida.push(args.map(String).join(' '));
    });
  });

  async function rodar(...argv: string[]): Promise<string> {
    const { registerUserCommand } = await import('./user.js');
    const program = new Command();
    program.exitOverride();
    registerUserCommand(program);
    await program.parseAsync(['node', 'taskin', 'user', ...argv]);
    return saida.join('\n');
  }

  it('add persists a user derived from the flags', async () => {
    await rodar('add', '--name', 'Ana Souza', '--email', 'ana@example.com');

    expect(registry.saveUser).toHaveBeenCalledTimes(1);
    expect(registry.saveUser).toHaveBeenCalledWith({
      id: 'ana-souza',
      name: 'Ana Souza',
      email: 'ana@example.com',
    });
  });

  it('add refuses an id that folds onto one already registered', async () => {
    registry.users = [{ id: 'sidartaveloso', name: 'Sidarta', email: 's@example.com' }];
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(rodar('add', '--name', 'Sidarta Veloso', '--email', 'x@example.com')).rejects.toThrow();

    expect(registry.saveUser).not.toHaveBeenCalled();
    exit.mockRestore();
  });

  it('add reports which in-use assignees now resolve and which still do not', async () => {
    state.tasks = [
      { assignee: { id: 'ana-souza', name: 'Ana Souza', email: '' } },
      { assignee: { id: 'bruno', name: 'Bruno', email: '' } },
    ];

    const out = await rodar('add', '--name', 'Ana Souza', '--email', 'ana@example.com');

    expect(out).toContain('now resolve to ana-souza');
    expect(out).toContain('"Ana Souza"');
    expect(out).toContain('Still resolving to nobody');
    expect(out).toContain('"Bruno"');
  });

  it('list prints every registered user', async () => {
    registry.users = [{ id: 'ana', name: 'Ana Souza', email: 'ana@example.com' }];

    const out = await rodar('list');

    expect(out).toContain('ana');
    expect(out).toContain('Ana Souza');
    expect(out).toContain('ana@example.com');
  });
});
