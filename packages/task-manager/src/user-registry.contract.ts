import { describe, expect, it } from 'vitest';
import type { IUserRegistry } from './user-registry.types.js';

/**
 * Contract suite every {@link IUserRegistry} implementation must pass.
 *
 * Lives in the agnostic package on purpose: a provider-specific registry (file
 * backed, GitHub, Redmine) proves itself against the same behaviour, and none of
 * them has to depend on another provider's package to do it. Exported through
 * the `./testing` subpath so `vitest` never enters the runtime import graph.
 *
 * @param createSubject - Builds a fresh, empty registry for each test
 * @public
 */
export function runUserRegistryContractTests(createSubject: () => Promise<IUserRegistry>): void {
  describe('IUserRegistry contract', () => {
    describe('saveUser / getUser', () => {
      it('should store and retrieve a user by ID', async () => {
        const registry = await createSubject();
        const user = { id: 'ana', name: 'Ana', email: 'ana@example.com' };
        await registry.saveUser(user);
        expect(registry.getUser('ana')).toEqual(user);
      });

      it('should return undefined for unknown user', async () => {
        const registry = await createSubject();
        expect(registry.getUser('unknown')).toBeUndefined();
      });
    });

    describe('resolveUser', () => {
      it('should return user by ID with avatar', async () => {
        const registry = await createSubject();
        await registry.saveUser({
          id: 'joao.silva',
          name: 'João Silva',
          email: 'joao@example.com',
        });

        const user = registry.resolveUser('joao.silva');
        expect(user).toBeDefined();
        expect(user!.id).toBe('joao.silva');
        expect(user!.avatar).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[a-f0-9]{32}\?d=mp$/);
      });

      it('should return user by name (case-insensitive)', async () => {
        const registry = await createSubject();
        await registry.saveUser({
          id: 'maria',
          name: 'Maria Souza',
          email: 'maria@example.com',
        });

        const user = registry.resolveUser('Maria Souza');
        expect(user).toBeDefined();
        expect(user!.id).toBe('maria');
        expect(user!.avatar).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[a-f0-9]{32}\?d=mp$/);
      });

      it('should return undefined for unknown user', async () => {
        const registry = await createSubject();
        const user = registry.resolveUser('unknown');
        expect(user).toBeUndefined();
      });
    });

    describe('createTemporaryUser', () => {
      it('should create user with Gravatar URL', async () => {
        const registry = await createSubject();
        const user = registry.createTemporaryUser('Carlos');

        expect(user.id).toBe('carlos');
        expect(user.name).toBe('Carlos');
        expect(user.email).toBe('carlos@example.com');
        expect(user.avatar).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[a-f0-9]{32}\?d=mp$/);
      });

      it('should create different Gravatar URLs for different inputs', async () => {
        const registry = await createSubject();
        const user1 = registry.createTemporaryUser('Alice');
        const user2 = registry.createTemporaryUser('Bob');
        expect(user1.avatar).not.toBe(user2.avatar);
      });
    });

    describe('ensureCurrentUser', () => {
      it('should create and return a user when registry is empty', async () => {
        const registry = await createSubject();
        const user = await registry.ensureCurrentUser({
          name: 'Test User',
          email: 'test@test.com',
        });

        expect(user.id).toBe('test-user');
        expect(user.name).toBe('Test User');
        expect(user.email).toBe('test@test.com');
      });

      it('should return existing user when email matches', async () => {
        const registry = await createSubject();
        await registry.saveUser({
          id: 'maria',
          name: 'Maria Souza',
          email: 'maria@example.com',
        });

        const user = await registry.ensureCurrentUser({
          name: 'Maria Souza',
          email: 'maria@example.com',
        });

        expect(user.id).toBe('maria');
        expect(registry.getAllUsers()).toHaveLength(1);
      });

      it('should create new user when email does not match any existing', async () => {
        const registry = await createSubject();
        await registry.saveUser({
          id: 'joao',
          name: 'João',
          email: 'joao@example.com',
        });

        const user = await registry.ensureCurrentUser({
          name: 'Maria',
          email: 'maria@example.com',
        });

        expect(user.id).toBe('maria');
        expect(registry.getAllUsers()).toHaveLength(2);
      });
    });

    describe('getAllUsers', () => {
      it('should return all saved users', async () => {
        const registry = await createSubject();
        await registry.saveUser({ id: 'a', name: 'A', email: 'a@a.com' });
        await registry.saveUser({ id: 'b', name: 'B', email: 'b@b.com' });

        const all = registry.getAllUsers();
        expect(all).toHaveLength(2);
        expect(all.map((u) => u.id)).toEqual(expect.arrayContaining(['a', 'b']));
      });

      it('should return empty array when no users', async () => {
        const registry = await createSubject();
        expect(registry.getAllUsers()).toEqual([]);
      });
    });
  });
}
