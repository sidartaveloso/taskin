import type { IUserRegistry } from '@opentask/taskin-task-manager';
import type { User } from '@opentask/taskin-types';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface UserRegistryConfig {
  /**
   * Caminho do diretório `.taskin/` do projeto — não da raiz do projeto.
   * O registro é lido de `<taskinDir>/.taskin-users.json`; ver
   * `resolveUsersFilePaths` em `users-file-location.ts`.
   */
  taskinDir: string;
}

export interface UsersData {
  users: Record<string, User>;
}

export interface ILogger {
  info(message: string): void;
  warn(message: string): void;
}

export const NullLogger: ILogger = {
  info: () => {},
  warn: () => {},
};

/**
 * Registry for managing user information
 * Loads users from .taskin-users.json
 */
function getGravatarUrl(email: string): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=mp`;
}

export class UserRegistry implements IUserRegistry {
  private users: Map<string, User> = new Map();
  private usersFilePath: string;
  private logger: ILogger;

  constructor(config: UserRegistryConfig, logger?: ILogger) {
    this.usersFilePath = path.join(config.taskinDir, '.taskin-users.json');
    this.logger = logger ?? NullLogger;
  }

  /**
   * Load users from .taskin-users.json
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.usersFilePath, 'utf-8');
      const data: UsersData = JSON.parse(content);

      this.users.clear();
      for (const [id, user] of Object.entries(data.users)) {
        this.users.set(id, user);
      }

      this.logger.info(`[UserRegistry] Loaded ${this.users.size} users`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.warn('[UserRegistry] .taskin-users.json not found, starting with empty registry');
        this.users.clear();
      } else {
        throw error;
      }
    }
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Resolve user from name or ID
   * Tries to match by ID first, then by name
   */
  resolveUser(nameOrId: string): User | undefined {
    // Try exact ID match first
    const byId = this.users.get(nameOrId);
    if (byId) return { ...byId, avatar: getGravatarUrl(byId.email) };

    // Try slug version of name
    const slug = nameOrId.toLowerCase().replace(/\s+/g, '-');
    const bySlug = this.users.get(slug);
    if (bySlug) return { ...bySlug, avatar: getGravatarUrl(bySlug.email) };

    // Try to find by name (case-insensitive)
    for (const user of this.users.values()) {
      if (user.name.toLowerCase() === nameOrId.toLowerCase()) {
        return { ...user, avatar: getGravatarUrl(user.email) };
      }
    }

    return undefined;
  }

  /**
   * Ensure a user matching the current git config exists in the registry.
   * Tries to find by email first; if not found, creates and persists a new user.
   * Falls back to process.env / defaults when no git config is available.
   */
  async ensureCurrentUser(gitConfig?: { name: string; email: string }): Promise<User> {
    let name: string;
    let email: string;

    if (gitConfig) {
      name = gitConfig.name;
      email = gitConfig.email;
    } else {
      name = this.readGitConfig('user.name') || process.env.USER || process.env.USERNAME || 'developer';
      email = this.readGitConfig('user.email') || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    }

    const existing = this.findByEmail(email);
    if (existing) return existing;

    const id = name.toLowerCase().replace(/\s+/g, '-');
    const user: User = { id, name, email };
    await this.saveUser(user);
    return user;
  }

  /**
   * Create a temporary user if not found in registry
   * Useful for backward compatibility
   */
  createTemporaryUser(nameOrId: string): User {
    const slug = nameOrId.toLowerCase().replace(/\s+/g, '-');
    const email = `${slug.replace(/\s+/g, '.')}@example.com`;
    return {
      id: slug,
      name: nameOrId,
      email,
      avatar: getGravatarUrl(email),
    };
  }

  private findByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  private readGitConfig(key: string): string | null {
    try {
      return execSync(`git config ${key}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
    } catch {
      return null;
    }
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Add or update a user
   */
  async saveUser(user: User): Promise<void> {
    this.users.set(user.id, user);
    await this.save();
  }

  /**
   * Save users to .taskin-users.json
   */
  private async save(): Promise<void> {
    const data: UsersData = {
      users: Object.fromEntries(this.users.entries()),
    };

    await fs.mkdir(path.dirname(this.usersFilePath), { recursive: true });
    await fs.writeFile(this.usersFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}
