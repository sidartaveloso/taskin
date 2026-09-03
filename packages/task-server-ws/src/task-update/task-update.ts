import { type Task, TaskPrioritizationUpdateSchema } from '@opentask/taskin-types';
import type { TaskUpdateOutcome } from './task-update.types.js';

/**
 * Applies a client-supplied update onto the task the server already has.
 *
 * The payload is untrusted JSON, so it is never the task: only the
 * prioritization fields are read from it, and everything else — id, status,
 * title, plus whatever the provider needs to locate the record (`filePath`,
 * `content`) — comes from `stored`. Before this existed the handler cast the
 * payload to the task shape and handed it straight to the provider, which
 * opens with `fs.readFile(task.filePath)`: a client that rebuilt the object
 * instead of echoing it back crashed the server.
 *
 * The four fields are replaced as a block, so an absent key clears the value.
 * That is deliberate — `JSON.stringify` drops `undefined`, so "ungroup this
 * task" arrives as a missing key, not as `null`.
 *
 * @param stored - The task as the server currently knows it
 * @param payload - The raw `payload` from the client's `update` message
 * @public
 */
export function applyTaskUpdate<TTask extends Task>(stored: TTask, payload: unknown): TaskUpdateOutcome<TTask> {
  const parsed = TaskPrioritizationUpdateSchema.safeParse(payload ?? {});

  if (!parsed.success) {
    const [issue] = parsed.error.issues;
    const field = issue?.path.join('.') ?? 'payload';
    return { ok: false, message: `Invalid task update: ${field} ${issue?.message ?? 'is invalid'}` };
  }

  const { order, groupId, groupName, difficulty } = parsed.data;

  return {
    ok: true,
    task: { ...stored, order, groupId, groupName, difficulty },
  };
}
