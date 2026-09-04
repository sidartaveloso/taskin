import type { User } from '@opentask/taskin-types';

/**
 * Interface for user directories.
 *
 * Resolving an assignee to a {@link User} is something every provider needs, and
 * each one answers it from a different place: the file system provider keeps a
 * JSON registry in `.taskin/`, a GitHub provider reads the issue's `assignees`
 * from the API, a Redmine provider queries its own user directory. So this port
 * lives here, next to {@link ITaskProvider}, and not inside any one provider —
 * declaring it in the file system package meant a remote provider had to import
 * from the file system provider just to implement it, the same boundary leak
 * that `TaskFile` had before task-031.
 *
 * A provider receives its registry injected; it never builds one. Implementations
 * are expected to pass the contract suite exported from
 * `@opentask/taskin-task-manager/testing`.
 *
 * @public
 */
export interface IUserRegistry {
  /** Load the directory into memory, if the implementation needs a warm-up. */
  load(): Promise<void>;

  /**
   * Look up a user by their exact id.
   * @returns The user, or `undefined` when the id is unknown
   */
  getUser(userId: string): User | undefined;

  /**
   * Look up a user by id or display name.
   * @returns The user, or `undefined` when nothing matches
   */
  resolveUser(nameOrId: string): User | undefined;

  /**
   * Ensure the person running the command exists in the directory, creating the
   * entry when it does not.
   * @param gitConfig - Identity to fall back on when the directory has no better source
   */
  ensureCurrentUser(gitConfig?: { name: string; email: string }): Promise<User>;

  /**
   * Build an in-memory user for a name that is not in the directory, so an
   * unknown assignee degrades instead of failing the whole read.
   */
  createTemporaryUser(nameOrId: string): User;

  /** Every user the directory knows about. */
  getAllUsers(): User[];

  /** Persist a user in the directory. */
  saveUser(user: User): Promise<void>;
}
