import type { IUserRegistry, ValidationIssue } from '@opentask/taskin-task-manager';
import type { User } from '@opentask/taskin-types';

/**
 * What the `Assignee:` line of a task actually points at.
 *
 * @public
 */
export type AssigneeIdentity =
  | { readonly kind: 'resolved'; readonly raw: string; readonly user: User }
  | { readonly kind: 'unassigned'; readonly raw: string }
  | { readonly kind: 'correctable'; readonly raw: string; readonly user: User }
  | { readonly kind: 'unknown'; readonly raw: string };

/**
 * Values that mean "nobody yet", not a person.
 *
 * The first two are what `createTask` writes when no assignee is given
 * (`i18n.defaultAssignee`, both locales); the third comes from the template in
 * `TASKS/README.md`. Treated as people, they showed up as contributors in
 * `taskin stats --team`.
 */
const PLACEHOLDER_ASSIGNEES = [
  'a definir',
  'to be defined',
  'nome do responsavel',
  'nome do responsável',
  'tbd',
  '-',
] as const satisfies readonly Lowercase<string>[];

/**
 * Classifies the raw `Assignee:` value of a task against the user registry.
 *
 * @param raw - The value as written in the task
 * @param registry - The directory to resolve against
 * @public
 */
/**
 * Collapses spelling differences that carry no meaning: case, and every
 * separator a human might or might not type (`sidarta-veloso`, `sidarta veloso`
 * and `sidartaveloso` all fold together).
 *
 * Deliberately not a fuzzy distance: a typo like `sidartaeloso` must NOT be
 * silently "corrected" into someone's name.
 */
export const foldAssignee = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const fold = foldAssignee;

export function classifyAssignee(
  raw: string,
  registry: Pick<IUserRegistry, 'resolveUser' | 'getAllUsers'>,
): AssigneeIdentity {
  const trimmed = raw.trim();

  if (trimmed === '' || (PLACEHOLDER_ASSIGNEES as readonly string[]).includes(trimmed.toLowerCase())) {
    return { kind: 'unassigned', raw };
  }

  const user = registry.resolveUser(trimmed);

  if (user) {
    return { kind: 'resolved', raw, user };
  }

  const folded = fold(trimmed);
  const matches = registry
    .getAllUsers()
    .filter((candidate) => fold(candidate.id) === folded || fold(candidate.name) === folded);
  const [onlyMatch] = matches;

  if (onlyMatch && matches.length === 1) {
    return { kind: 'correctable', raw, user: onlyMatch };
  }

  return { kind: 'unknown', raw };
}

/**
 * Turns the identities that need a human decision into lint issues.
 *
 * `resolved` and `unassigned` produce nothing: one is correct, the other is a
 * legitimate "nobody yet" that `createTask` writes itself.
 *
 * @param tasks - The tasks to check, with the file each one came from
 * @param registry - The directory to resolve against
 * @public
 */
export function validateAssignees(
  tasks: readonly { readonly file: string; readonly assignee: string | undefined }[],
  registry: Pick<IUserRegistry, 'resolveUser' | 'getAllUsers'>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const task of tasks) {
    if (task.assignee === undefined) continue;

    const identity = classifyAssignee(task.assignee, registry);

    switch (identity.kind) {
      case 'resolved':
      case 'unassigned':
        break;
      case 'correctable':
        issues.push({
          file: task.file,
          message: `Assignee "${identity.raw.trim()}" is not in the user registry, but folds onto exactly one registered user.`,
          severity: 'warning',
          suggestion: `Rewrite it as "${identity.user.id}" — lint --fix does this.`,
        });
        break;
      case 'unknown':
        issues.push({
          file: task.file,
          message: `Assignee "${identity.raw.trim()}" resolves to nobody in the user registry, so it silently becomes a fabricated temporary user.`,
          severity: 'warning',
          suggestion: `Register them in ${'.taskin/.taskin-users.json'}, or fix the spelling — too ambiguous for --fix to decide.`,
        });
        break;
      default:
        identity satisfies never;
    }
  }

  return issues;
}

/**
 * Rewrites the `Assignee:` line for every identity that folds onto exactly one
 * registered user.
 *
 * Only the unambiguous case is touched. A typo with no single match, or a
 * spelling that folds onto two users, stays as written — guessing someone's
 * identity from an edit distance is worse than leaving the warning up.
 *
 * @returns The files that were rewritten
 * @public
 */
export async function fixAssignees(
  tasks: readonly { readonly file: string; readonly assignee: string | undefined }[],
  registry: Pick<IUserRegistry, 'resolveUser' | 'getAllUsers'>,
  io: { readFile: (path: string) => Promise<string>; writeFile: (path: string, content: string) => Promise<void> },
): Promise<string[]> {
  const rewritten: string[] = [];

  for (const task of tasks) {
    if (task.assignee === undefined) continue;

    const identity = classifyAssignee(task.assignee, registry);
    if (identity.kind !== 'correctable') continue;

    const content = await io.readFile(task.file);
    const next = content.replace(/^(Assignee:[ \t]*)(.*)$/im, (_line, label: string) => `${label}${identity.user.id}`);

    if (next !== content) {
      await io.writeFile(task.file, next);
      rewritten.push(task.file);
    }
  }

  return rewritten;
}

/**
 * Recognises the user that older versions of `initialize()` seeded.
 *
 * That code built the entry from `process.env.USER || 'developer'`: the id as
 * given, the name capitalized, and the e-mail as `<id>@example.com`. Matching
 * the whole shape — and not just the `@example.com` domain — is what keeps a
 * real `ana-souza` whose e-mail happens to be `ana@example.com` out of this.
 */
function isSeededUser(user: User): boolean {
  const capitalized = user.id.charAt(0).toUpperCase() + user.id.slice(1);
  return user.email === `${user.id}@example.com` && user.name === capitalized;
}

/**
 * Reports a seeded synthetic user that no task points at.
 *
 * Report only: it is still user data, so removing it is the human's call.
 *
 * @param assignees - Every raw `Assignee:` value in use
 * @param registry - The directory to inspect
 * @public
 */
export function validateSeededUsers(
  assignees: readonly (string | undefined)[],
  registry: Pick<IUserRegistry, 'resolveUser' | 'getAllUsers'>,
): ValidationIssue[] {
  const referenced = new Set(
    assignees.flatMap((raw) => {
      if (raw === undefined) return [];
      const identity = classifyAssignee(raw, registry);
      return identity.kind === 'resolved' || identity.kind === 'correctable' ? [identity.user.id] : [];
    }),
  );

  return registry
    .getAllUsers()
    .filter((user) => isSeededUser(user) && !referenced.has(user.id))
    .map((user) => ({
      file: `${'.taskin/.taskin-users.json'} (${user.id})`,
      message: `User "${user.id}" looks like the placeholder that older taskin versions seeded on init (${user.email}), and no task points at it.`,
      severity: 'warning' as const,
      suggestion: `Remove it from the registry, or give it the real name and e-mail of whoever it stands for.`,
    }));
}
