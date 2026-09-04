import type { IUserRegistry } from '@opentask/taskin-task-manager';
import type { User } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { classifyAssignee } from './assignee-identity';

const ANA: User = { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' };

function registryWith(...users: User[]): IUserRegistry {
  const byId = new Map(users.map((user) => [user.id, user]));

  return {
    load: async () => {},
    getUser: (id: string) => byId.get(id),
    resolveUser: (nameOrId: string) =>
      users.find((user) => user.id === nameOrId || user.name.toLowerCase() === nameOrId.toLowerCase()),
    ensureCurrentUser: async () => users[0] as User,
    createTemporaryUser: (nameOrId: string) => ({ id: nameOrId, name: nameOrId, email: `${nameOrId}@invalid` }),
    getAllUsers: () => users,
    saveUser: async () => {},
  };
}

describe('classifyAssignee', () => {
  it('reports a registered user as resolved', () => {
    const identity = classifyAssignee('ana-souza', registryWith(ANA));

    expect(identity).toEqual({ kind: 'resolved', raw: 'ana-souza', user: ANA });
  });

  // O provider escreve esses placeholders ele mesmo quando `new` roda sem -u, e o
  // template do TASKS/README.md carrega o terceiro. Tratados como pessoa, eles
  // apareciam como contribuidor no `stats --team`.
  it.each(['A definir', 'To be defined', 'Nome do responsavel', 'Nome do responsável', 'TBD', '-'])(
    'reports the placeholder %j as unassigned, not as a person',
    (placeholder) => {
      const identity = classifyAssignee(placeholder, registryWith(ANA));

      expect(identity).toEqual({ kind: 'unassigned', raw: placeholder });
    },
  );

  it('ignores case and surrounding space when recognising a placeholder', () => {
    expect(classifyAssignee('  a DEFINIR  ', registryWith(ANA))).toEqual({ kind: 'unassigned', raw: '  a DEFINIR  ' });
  });

  it('reports an empty value as unassigned', () => {
    expect(classifyAssignee('   ', registryWith(ANA))).toEqual({ kind: 'unassigned', raw: '   ' });
  });

  // `sidartaveloso` neste repo: o id e `sidarta-veloso` e o nome `Sidarta Veloso`,
  // entao `resolveUser` falha e o assignee virava usuario temporario fabricado.
  it('reports a spelling that matches exactly one user as correctable', () => {
    const identity = classifyAssignee('anasouza', registryWith(ANA));

    expect(identity).toEqual({ kind: 'correctable', raw: 'anasouza', user: ANA });
  });

  // `sidartaeloso` neste repo: falta um `v`. Distancia de edicao seria adivinhacao.
  it('leaves a typo unknown instead of guessing the closest user', () => {
    expect(classifyAssignee('anasoza', registryWith(ANA))).toEqual({ kind: 'unknown', raw: 'anasoza' });
  });

  it('leaves an ambiguous spelling unknown when it folds onto two users', () => {
    const anaById: User = { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' };
    const anaByName: User = { id: 'a-souza', name: 'Ana-Souza', email: 'outra@example.com' };

    expect(classifyAssignee('anasouza', registryWith(anaById, anaByName))).toEqual({
      kind: 'unknown',
      raw: 'anasouza',
    });
  });

  it('reports someone who was never registered as unknown', () => {
    expect(classifyAssignee('fernandogatti', registryWith(ANA))).toEqual({
      kind: 'unknown',
      raw: 'fernandogatti',
    });
  });
});
