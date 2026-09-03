import { type TaskId, TaskIdSchema } from '@opentask/taskin-types';

/**
 * Turns what the user typed into a validated {@link TaskId}.
 *
 * This is the boundary: everything inside the domain speaks `TaskId`, and the
 * only way in is through here. Accepts the forms a person actually types —
 * `20`, `020`, `task-020` — and normalizes them to the id the provider stores
 * (the zero-padded numeric part of the file name).
 *
 * Returns `undefined` instead of throwing so each command can report the
 * problem in its own voice; a ZodError stack is not a CLI error message.
 *
 * @public
 */
export function normalizeTaskId(input: string): TaskId | undefined {
  // Valida ANTES de padronizar: `padStart` transforma '' em '000', entao
  // `taskin start ''` viraria a task 000 em vez de um erro.
  const digits = input.trim().replace(/^task-/, '');
  if (!/^\d+$/.test(digits)) return undefined;

  const result = TaskIdSchema.safeParse(digits.padStart(3, '0'));
  return result.success ? result.data : undefined;
}
