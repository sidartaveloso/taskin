import type { IUserRegistry } from '@opentask/taskin-task-manager';
import { runUserRegistryContractTests } from '@opentask/taskin-task-manager/testing';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UserRegistry } from './user-registry.js';

const testDir = join(process.cwd(), '.test-user-registry');
const taskinDir = join(testDir, '.taskin');

async function createFileSystemUserRegistry(): Promise<IUserRegistry> {
  rmSync(testDir, { recursive: true, force: true });
  mkdirSync(taskinDir, { recursive: true });
  const registry = new UserRegistry({ taskinDir });
  await registry.load();
  return registry;
}

runUserRegistryContractTests(createFileSystemUserRegistry);

describe('UserRegistry filesystem implementation', () => {
  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(taskinDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('persistence', () => {
    it('should persist a user to disk that survives re-load', async () => {
      const registry = new UserRegistry({ taskinDir });
      await registry.load();
      const user = await registry.ensureCurrentUser({
        name: 'Test User',
        email: 'test@test.com',
      });

      // Re-load from disk
      const fresh = new UserRegistry({ taskinDir });
      await fresh.load();
      expect(fresh.getUser('test-user')).toBeDefined();
      expect(fresh.getUser('test-user')!.email).toBe('test@test.com');
    });

    it('should persist ensureCurrentUser fallback user to disk', async () => {
      const registry = new UserRegistry({ taskinDir });
      await registry.load();

      const user = await registry.ensureCurrentUser();

      const fresh = new UserRegistry({ taskinDir });
      await fresh.load();
      expect(fresh.getUser(user.id)).toBeDefined();
    });
  });

  describe('Gravatar URL format', () => {
    it('should produce valid Gravatar URL matching known hash', () => {
      const registry = new UserRegistry({ taskinDir });
      const user = registry.createTemporaryUser('Ana');

      expect(user.avatar).toMatch(/^https:\/\/www\.gravatar\.com\/avatar\/[a-f0-9]{32}\?d=mp$/);
    });

    it('should use md5 hash of the generated email', () => {
      const registry = new UserRegistry({ taskinDir });

      const user = registry.createTemporaryUser('Test User');
      // slug = 'test-user', email = 'test-user@example.com'
      // MD5('test-user@example.com') = 3664adb7d1eea0bd7d0b134577663889
      expect(user.avatar).toBe('https://www.gravatar.com/avatar/3664adb7d1eea0bd7d0b134577663889?d=mp');
    });
  });
});
