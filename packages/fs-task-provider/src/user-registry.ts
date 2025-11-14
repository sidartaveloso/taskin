import type { User } from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import path from 'path';

export interface UserRegistryConfig {
  /** Path to the .taskin directory */
  taskinDir: string;
}

export interface UsersData {
  users: Record<string, User>;
}

/**
 * Registry for managing user information
 * Loads users from .taskin/users.json
 */
export class UserRegistry {
  private users: Map<string, User> = new Map();
  private usersFilePath: string;

  constructor(private config: UserRegistryConfig) {
    this.usersFilePath = path.join(config.taskinDir, 'users.json');
  }

  /**
   * Load users from users.json
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.usersFilePath, 'utf-8');
      const data: UsersData = JSON.parse(content);

      this.users.clear();
      for (const [id, user] of Object.entries(data.users)) {
        this.users.set(id, user);
      }

      console.log(`[UserRegistry] Loaded ${this.users.size} users`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(
          '[UserRegistry] users.json not found, starting with empty registry',
        );
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
    if (byId) return byId;

    // Try slug version of name
    const slug = nameOrId.toLowerCase().replace(/\s+/g, '-');
    const bySlug = this.users.get(slug);
    if (bySlug) return bySlug;

    // Try to find by name (case-insensitive)
    for (const user of this.users.values()) {
      if (user.name.toLowerCase() === nameOrId.toLowerCase()) {
        return user;
      }
    }

    return undefined;
  }

  /**
   * Create a temporary user if not found in registry
   * Useful for backward compatibility
   */
  createTemporaryUser(nameOrId: string): User {
    const slug = nameOrId.toLowerCase().replace(/\s+/g, '-');
    return {
      id: slug,
      name: nameOrId,
      email: `${slug.replace(/\s+/g, '.')}@example.com`,
    };
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
   * Save users to users.json
   */
  private async save(): Promise<void> {
    const data: UsersData = {
      users: Object.fromEntries(this.users.entries()),
    };

    await fs.writeFile(
      this.usersFilePath,
      JSON.stringify(data, null, 2),
      'utf-8',
    );
  }
}
