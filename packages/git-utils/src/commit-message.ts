/**
 * Commit message construction for Taskin's automatic commits.
 *
 * The single place that knows how a status commit is spelled. It used to be
 * seven interpolations spread across three packages, and they had already
 * drifted: `[skip-ci]` in six of them, `[skip ci]` in the seventh.
 *
 * @packageDocumentation
 */

/**
 * The commit-message strings GitHub Actions documents as skipping a workflow
 * run. `[skip ci]` and `[ci skip]` are also the two forms GitLab and Bitbucket
 * accept, which is why the default is one of them.
 *
 * The hyphenated `[skip-ci]` is deliberately absent: no platform recognizes it,
 * and Bitbucket's documentation says so explicitly.
 *
 * @public
 */
export const CI_SKIP_TAGS = ['[skip ci]', '[ci skip]', '[no ci]', '[skip actions]', '[actions skip]'] as const;

/**
 * A commit-message tag documented by GitHub Actions.
 *
 * @public
 */
export type CiSkipTag = (typeof CI_SKIP_TAGS)[number];

/**
 * The tag Taskin uses when a project has not configured one.
 *
 * Chosen as the intersection of the three platforms: GitHub Actions lists it,
 * GitLab skips on it natively, and Bitbucket accepts it.
 *
 * @public
 */
export const DEFAULT_CI_SKIP_TAG: CiSkipTag = '[skip ci]';

/**
 * Whether a string is one of the tags the platforms document.
 *
 * Comparison is case-insensitive because GitLab documents capitalization as
 * irrelevant, and GitHub's documentation makes no claim either way.
 *
 * A tag outside this list is not an error — Azure DevOps uses `***NO_CI***`
 * and a self-hosted pipeline can match anything. This is what callers use to
 * decide whether to *warn*, not whether to accept.
 *
 * @public
 */
export function isRecognizedCiSkipTag(tag: string): boolean {
  const normalized = tag.trim().toLowerCase();
  return CI_SKIP_TAGS.some((known) => known === normalized);
}

/**
 * Appends a CI-skip tag to a commit subject.
 *
 * An empty or whitespace-only tag appends nothing: that is how a project asks
 * for its pipeline to run on status commits.
 *
 * @public
 */
export function appendCiSkipTag(subject: string, ciSkipTag: string = DEFAULT_CI_SKIP_TAG): string {
  const tag = ciSkipTag.trim();

  if (tag.length === 0) return subject;
  if (subject.endsWith(tag)) return subject;

  return `${subject} ${tag}`;
}

/**
 * Options for {@link buildTaskStatusCommitMessage}.
 *
 * @public
 */
export interface TaskStatusCommitMessageOptions {
  /** Normalized task id, e.g. `052`. */
  taskId: string;
  /** Status the task is moving to, e.g. `in-progress`. */
  status: string;
  /** Tag to append. Defaults to {@link DEFAULT_CI_SKIP_TAG}; empty means none. */
  ciSkipTag?: string;
}

/**
 * The commit message for a task status change.
 *
 * @public
 */
export function buildTaskStatusCommitMessage(options: TaskStatusCommitMessageOptions): string {
  const subject = `docs(TASKS): task-${options.taskId} - atualiza status para ${options.status}`;

  return appendCiSkipTag(subject, options.ciSkipTag);
}
