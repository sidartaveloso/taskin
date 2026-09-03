import type { Task } from '@opentask/taskin-types';

/**
 * Result of validating and applying an incoming task update.
 *
 * A discriminated union instead of throwing: the caller is a message handler
 * that has to answer the client either way, and `message` is what it sends.
 *
 * @public
 */
export type TaskUpdateOutcome<TTask extends Task = Task> =
  | { readonly ok: true; readonly task: TTask }
  | { readonly ok: false; readonly message: string };
