import type { ITaskProvider, IUserRegistry, Task } from '@opentask/taskin-task-manager';

declare const providerShape: unique symbol;

/**
 * A task whose provider-specific shape the CLI does not know.
 *
 * The factory picks the provider at runtime, from `.taskin.json`, so no command
 * can know statically whether it is holding a `TaskFile` (with `content` and
 * `filePath`) or a GitHub-backed task. Typing the bundle as
 * `ITaskProvider<Task>` would be a lie in a way that breaks at runtime:
 * `ITaskProvider` members are function properties precisely so that
 * `ITaskProvider<TaskFile>` is *not* assignable to `ITaskProvider<Task>` — see
 * the note in `task-manager.types.ts`. Accepting a plain `Task` in
 * `updateTask` is what used to blow up on `task.filePath`.
 *
 * So the shape stays opaque: the brand makes a value impossible to fabricate,
 * which means the only tasks a command can hand back to `updateTask` are ones
 * it got from `findTask`/`getAllTasks`/the manager — exactly the guarantee the
 * provider needs. Reading is unaffected: every field of `Task` is still there.
 *
 * @public
 */
export type OpaqueTask = Task & { readonly [providerShape]: unknown };

/**
 * The provider and its user directory, resolved together.
 *
 * They travel as a pair because they are chosen by the same configuration: a
 * file-backed provider resolves assignees from `.taskin/.taskin-users.json`,
 * while a remote provider resolves them from its own API. Handing out one
 * without the other is how the CLI ended up with `list` reading the registry
 * from the wrong directory.
 *
 * @public
 */
export interface ProviderBundle {
  /** The configured task provider, already initialized */
  provider: ITaskProvider<OpaqueTask>;
  /** The user directory that matches the provider, already loaded */
  userRegistry: IUserRegistry;
  /** Absolute path of the project root that was resolved */
  projectRoot: string;
  /** The `provider.type` that produced this bundle */
  providerType: string;
}

/**
 * Options for {@link resolveTaskProvider}.
 *
 * @public
 */
export interface ResolveProviderOptions {
  /** Project root; defaults to `process.cwd()` */
  cwd?: string;
  /**
   * Overrides the provider's own notion of where tasks live (the `-p/--path`
   * flag). Only meaningful for providers backed by a directory.
   */
  tasksDir?: string;
  /**
   * Merged over `provider.config` from `.taskin.json`, for this run only.
   *
   * How a flag reaches a provider without widening the provider-agnostic
   * contract: `--metadata-style` means something to the file provider and
   * nothing to a Jira one, so it travels as configuration rather than as a
   * parameter of `ITaskProvider.lint`.
   */
  configOverrides?: Record<string, unknown>;
}

/**
 * What a provider builder receives.
 *
 * @public
 */
export interface ProviderBuildContext {
  /** Absolute project root (the directory holding `.taskin.json`) */
  projectRoot: string;
  /** `provider.config` from `.taskin.json`, with `${VAR}` already expanded */
  providerConfig: Record<string, unknown>;
  /** Where tasks live, when the caller overrode it (the `-p/--path` flag) */
  tasksDirOverride?: string;
}

/**
 * Builds one provider and the user directory that matches it.
 *
 * The registry is not loaded by the builder — {@link resolveTaskProvider} does
 * that, so no builder can forget to.
 *
 * @public
 */
export type ProviderBuilder = (
  context: ProviderBuildContext,
) => Promise<{ provider: ITaskProvider<OpaqueTask>; userRegistry: IUserRegistry }>;
