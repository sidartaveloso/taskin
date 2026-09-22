/**
 * The CommonMark hard break that ends a metadata line in the `hard-break`
 * style.
 *
 * A backslash, and not the two trailing spaces the convention used before:
 * those were invisible, `git diff --check` reports them as errors, and
 * `trim_trailing_whitespace` strips them — which is why `.editorconfig` had to
 * turn that off for `*.md`.
 *
 * It belongs on every line **but the last**. On the last one there is no
 * following line to break, so CommonMark renders it as a literal `\` on
 * screen; that is the defect the metadata styles exist to fix. See
 * {@link ./metadata-style}.
 *
 * @public
 */
export const HARD_BREAK = '\\';

/**
 * Removes the trailing hard break from a metadata value.
 *
 * Kept for consumers outside this package that already call it. New code
 * should read through `readMetadataField`, which strips every marking — the
 * bullet of the `list` style included — instead of just this one.
 *
 * @public
 */
export function stripHardBreak(value: string): string {
  return value.replace(/\\$/, '').trim();
}
