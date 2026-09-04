/**
 * The CommonMark hard break that ends each inline metadata line.
 *
 * A backslash, and not the two trailing spaces the convention used before:
 * those were invisible, `git diff --check` reports them as errors, and
 * `trim_trailing_whitespace` strips them — which is why `.editorconfig` had to
 * turn that off for `*.md`. Only 3 of 45 `Assignee:` lines in this repository
 * ever carried them, which is how well an invisible convention holds.
 *
 * The break is formatting, not data: everything that reads a metadata value
 * must go through {@link stripHardBreak}, or `Status: pending\` stops being a
 * valid status.
 *
 * @public
 */
export const HARD_BREAK = '\\';

/**
 * Removes the trailing hard break (either spelling) from a metadata value.
 *
 * Accepts the legacy two-space form so files that have not been normalized yet
 * keep reading correctly.
 *
 * @public
 */
export function stripHardBreak(value: string): string {
  return value.replace(/\\$/, '').trim();
}
