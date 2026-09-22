/**
 * user command - Manage the project's user registry (.taskin/.taskin-users.json)
 *
 * `init` offers to create the first user and then tells people they can "create
 * users later with the registry commands" — this is those commands. Until now
 * the only way to see who was registered, or to add someone, was to open the
 * JSON by hand, even though half of `lint`'s warnings are about identity and
 * point at that same file.
 *
 * Scope is deliberately `list` and `add`: the two that close the loop on those
 * warnings. `remove` and `rename` are left out on purpose — changing or dropping
 * an id breaks every `Assignee:` that points at it, and a command that rewrites
 * task files as a side effect is a larger, separate change (see task-055).
 */

import { classifyAssignee, foldAssignee } from '@opentask/taskin-file-system-provider';
import { GitAnalyzer } from '@opentask/taskin-git-utils';
import type { IUserRegistry } from '@opentask/taskin-task-manager';
import { type User, UserSchema } from '@opentask/taskin-types';
import type { Command } from 'commander';
import inquirer from 'inquirer';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';

/** The registry seam the resolution report runs against — narrow enough to fake. */
type ResolverRegistry = Pick<IUserRegistry, 'resolveUser' | 'getAllUsers'>;

/** The slug used as the default id derived from a display name. */
export function slugifyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * The looser identity two ids share when they fold onto the same person:
 * lowercase, letters and digits only. It is what makes `Sidarta Veloso` and
 * `sidartaveloso` the same entry, and what `add` uses to refuse a duplicate.
 */
export function foldId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** The fields `add` needs; `id` defaults to a slug of the name when omitted. */
export interface NewUserInput {
  id?: string;
  name: string;
  email: string;
}

/**
 * Builds a validated {@link User} from user input.
 *
 * `UserSchema.parse` is the same validator the rest of the system uses, so a
 * malformed email is refused here rather than written to the registry.
 */
export function buildUser(input: NewUserInput): User {
  const name = input.name.trim();
  const id = input.id?.trim() || slugifyName(name);

  return UserSchema.parse({ id, name, email: input.email.trim() });
}

/**
 * The registered user a new id would collide with, if any: an exact id match, or
 * one that folds onto the same person.
 */
export function findIdConflict(existing: User[], id: string): User | undefined {
  const folded = foldId(id);
  return existing.find((user) => user.id === id || foldId(user.id) === folded);
}

/** Quotes each value for a human-readable inline list. */
function quoteList(values: readonly string[]): string {
  return values.map((value) => `"${value}"`).join(', ');
}

/**
 * How a fresh `add` changes the assignees already in use: the spellings it just
 * made resolve to `newUser`, and the ones that still resolve to nobody.
 *
 * @public
 */
export interface AssigneeResolution {
  /** Distinct in-use spellings that now resolve to the freshly added user. */
  nowResolving: string[];
  /** Distinct in-use spellings that still resolve to nobody. */
  stillUnresolved: string[];
}

/**
 * Closes the loop on half of `lint`'s warnings: after registering someone, the
 * person sees how many `Assignee:` lines stop being fabricated temporary users,
 * and which ones are still waiting on a cadastro.
 *
 * `registry` must already contain `newUser`. The same {@link classifyAssignee}
 * the linter uses decides each verdict, so a placeholder like "to be defined"
 * counts as neither: it is `unassigned`, not a person who failed to resolve.
 *
 * @public
 */
export function resolveAssignees(
  rawAssignees: readonly string[],
  registry: ResolverRegistry,
  newUser: User,
): AssigneeResolution {
  const nowResolving = new Set<string>();
  const stillUnresolved = new Set<string>();

  for (const raw of rawAssignees) {
    const trimmed = raw.trim();
    if (trimmed === '') continue;

    const identity = classifyAssignee(trimmed, registry);
    if ((identity.kind === 'resolved' || identity.kind === 'correctable') && identity.user.id === newUser.id) {
      nowResolving.add(trimmed);
    } else if (identity.kind === 'unknown') {
      stillUnresolved.add(trimmed);
    }
  }

  return { nowResolving: [...nowResolving], stillUnresolved: [...stillUnresolved] };
}

/**
 * Commit-author names that belong to `newUser` but that the chosen `name` leaves
 * out.
 *
 * The registry resolves a commit author by name (`a.name || a.email`), not by
 * e-mail, so a name that folds onto this person yet does not resolve to them
 * means their commits keep counting as a separate contributor. Registering with
 * `--name` set to one of these is what folds the history back together.
 *
 * @public
 */
export function authorNamesNotAttributed(
  authorNames: readonly string[],
  registry: Pick<IUserRegistry, 'resolveUser'>,
  newUser: User,
): string[] {
  const belongsTo = new Set([foldAssignee(newUser.id), foldAssignee(newUser.name)]);
  const missed = new Set<string>();

  for (const name of authorNames) {
    const trimmed = name.trim();
    if (trimmed === '' || !belongsTo.has(foldAssignee(trimmed))) continue;
    if (registry.resolveUser(trimmed)?.id !== newUser.id) missed.add(trimmed);
  }

  return [...missed];
}

/** One aligned row per user — id, name, email — with a header row on top. */
export function formatUserList(users: User[]): string[] {
  const idWidth = Math.max(2, ...users.map((user) => user.id.length));
  const nameWidth = Math.max(4, ...users.map((user) => user.name.length));

  const header = `${'id'.padEnd(idWidth)}  ${'name'.padEnd(nameWidth)}  email`;
  const rows = users.map((user) => `${user.id.padEnd(idWidth)}  ${user.name.padEnd(nameWidth)}  ${user.email}`);

  return [header, ...rows];
}

async function listUsers(): Promise<void> {
  requireTaskinProject();
  const { userRegistry } = await resolveTaskProvider();

  printHeader('Users', '👥');

  const users = userRegistry.getAllUsers();
  if (users.length === 0) {
    console.log(colors.warning('No users registered yet. Add one with "taskin user add".'));
    return;
  }

  const [header, ...rows] = formatUserList(users);
  console.log(colors.highlight(header ?? ''));
  console.log(colors.secondary('─'.repeat((header ?? '').length)));
  for (const row of rows) {
    console.log(colors.normal(row));
  }
  console.log();
  console.log(colors.info(`👥 Total: ${users.length} ${users.length === 1 ? 'user' : 'users'}`));
}

interface AddUserOptions {
  id?: string;
  name?: string;
  email?: string;
}

/** Prompts only for the fields that were not supplied on the command line. */
async function promptMissingFields(options: AddUserOptions): Promise<NewUserInput> {
  const name =
    options.name ??
    (
      await inquirer.prompt<{ name: string }>([
        {
          type: 'input',
          name: 'name',
          message: 'Full name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
      ])
    ).name;

  const email =
    options.email ??
    (
      await inquirer.prompt<{ email: string }>([
        {
          type: 'input',
          name: 'email',
          message: 'Email:',
          default: `${slugifyName(name).replace(/-/g, '.')}@example.com`,
          validate: (input: string) => input.includes('@') || 'A valid email is required',
        },
      ])
    ).email;

  return { ...(options.id ? { id: options.id } : {}), name, email };
}

async function addUser(options: AddUserOptions): Promise<void> {
  requireTaskinProject();
  const { provider, userRegistry, projectRoot } = await resolveTaskProvider();

  printHeader('Add User', '👥');

  const input = await promptMissingFields(options);
  const user = buildUser(input);

  const conflict = findIdConflict(userRegistry.getAllUsers(), user.id);
  if (conflict) {
    error(`A user already resolves to "${user.id}": ${conflict.name} (${conflict.id}).`);
    info('Pick a different id with --id, or edit the existing entry.');
    process.exit(1);
  }

  // Snapshot before the registry changes: the report is about what this add makes
  // resolve, so it must be measured against the state the add is about to leave.
  const inUseAssignees = await collectInUseAssignees(provider);
  const authorNames = await collectCommitAuthorNames(projectRoot);

  await userRegistry.saveUser(user);
  success(`Registered ${colors.highlight(user.name)} (${user.id}) — ${user.email}`);

  reportNewlyResolving(user);
  reportAssigneeResolution(inUseAssignees, userRegistry, user);
  reportUnattributedAuthors(authorNames, userRegistry, user);
}

/** Every `Assignee:` value in use, as the provider read it from the tasks. */
async function collectInUseAssignees(provider: {
  getAllTasks(): Promise<readonly { assignee?: User }[]>;
}): Promise<string[]> {
  try {
    const tasks = await provider.getAllTasks();
    return tasks.map((task) => task.assignee?.name).filter((name): name is string => typeof name === 'string');
  } catch {
    return [];
  }
}

/** Every commit-author name in history, or none when git is unavailable. */
async function collectCommitAuthorNames(projectRoot: string): Promise<string[]> {
  try {
    const authors = await new GitAnalyzer(projectRoot).getAuthors();
    return authors.map((author) => author.name);
  } catch {
    return [];
  }
}

/**
 * The three spellings this id now answers to, so the person can see that the
 * assignee they typed in a task file will resolve — the same three paths
 * `resolveUser` matches: the id, the name, and the name's slug.
 */
function reportNewlyResolving(user: User): void {
  const spellings = Array.from(new Set([user.id, user.name, slugifyName(user.name)]));
  info(`Assignees that now resolve: ${quoteList(spellings)}`);
}

/** What the add changed for the assignees already written in the tasks. */
function reportAssigneeResolution(inUseAssignees: readonly string[], registry: ResolverRegistry, user: User): void {
  const { nowResolving, stillUnresolved } = resolveAssignees(inUseAssignees, registry, user);

  if (nowResolving.length > 0) {
    const noun = nowResolving.length === 1 ? 'assignee' : 'assignees';
    info(`${nowResolving.length} in-use ${noun} now resolve to ${user.id}: ${quoteList(nowResolving)}`);
  }

  if (stillUnresolved.length > 0) {
    console.log(
      colors.warning(
        `Still resolving to nobody (${stillUnresolved.length}): ${quoteList(stillUnresolved)} — register them too.`,
      ),
    );
  }
}

/** Warns when the chosen name leaves a commit author's history off this user. */
function reportUnattributedAuthors(authorNames: readonly string[], registry: ResolverRegistry, user: User): void {
  const missed = authorNamesNotAttributed(authorNames, registry, user);
  if (missed.length === 0) return;

  console.log(
    colors.warning(
      `Commits authored as ${quoteList(missed)} won't fold onto ${user.id}: the registry matches commit authors ` +
        `by name. Register with --name set to one of these to keep the history on one contributor.`,
    ),
  );
}

/**
 * Registers `taskin user` with its `list` and `add` sub-commands.
 *
 * A plain function rather than {@link defineCommand} because that helper models a
 * single action, and this command branches into sub-commands. `users` is an
 * alias so both spellings work.
 */
export function registerUserCommand(program: Command): void {
  const userCmd = program.command('user').alias('users').description('👥 Manage the project user registry');

  userCmd
    .command('list', { isDefault: true })
    .alias('ls')
    .description('List registered users (id, name, email)')
    .action(async () => {
      try {
        await listUsers();
      } catch (err) {
        error(`Failed to list users: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });

  userCmd
    .command('add [name]')
    .description('Register a new user in the project directory')
    .option('--id <id>', 'User id (defaults to a slug of the name)')
    .option('--name <name>', 'Full name')
    .option('--email <email>', 'Email address')
    .action(async (name: string | undefined, options: AddUserOptions) => {
      try {
        await addUser({ ...options, ...((options.name ?? name) ? { name: options.name ?? name } : {}) });
      } catch (err) {
        error(`Failed to add user: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
