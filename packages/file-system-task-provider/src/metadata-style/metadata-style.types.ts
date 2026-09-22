/**
 * The three ways a task file can mark its inline metadata block.
 *
 * They differ only in the marking, never in the data:
 *
 * | id | raw | rendered |
 * | --- | --- | --- |
 * | `list` | `- Status: pending` | three lines (`<li>`) |
 * | `hard-break` | `Status: pending\` (except the last) | three lines (`<br>`) |
 * | `plain` | `Status: pending` | collapses into one paragraph |
 *
 * @public
 */
export type MetadataStyleId = 'list' | 'hard-break' | 'plain';

/**
 * One `Label: value` pair of the metadata block, with the marking removed.
 *
 * The label is kept as written so a Portuguese file stays Portuguese: reading
 * and rewriting `Responsável` must not turn it into `Assignee`.
 *
 * @public
 */
export interface MetadataField {
  readonly label: string;
  readonly value: string;
}

/**
 * A metadata marking style.
 *
 * `read` is deliberately tolerant in every implementation — it accepts all
 * three markings — while `write` and `format` emit this style and only this
 * one. Reading is parsing, not configuration: files written by older versions,
 * and files edited by hand, have to keep working whatever the configured style
 * is.
 *
 * @public
 */
export interface MetadataStyle {
  readonly id: MetadataStyleId;

  /**
   * Whether a metadata block, given as its raw lines, is written in this style.
   */
  matches(blockLines: readonly string[]): boolean;

  /**
   * Reads one field, with the marking stripped. Tolerant of all three styles.
   */
  read(content: string, label: string): string | undefined;

  /**
   * Upserts (or, with `value === undefined`, removes) one field, re-emitting
   * the whole block in this style so the marking stays consistent.
   */
  write(content: string, label: string, value: string | undefined): string;

  /**
   * Renders a whole block, for a file being created.
   */
  format(fields: readonly MetadataField[]): string;
}
