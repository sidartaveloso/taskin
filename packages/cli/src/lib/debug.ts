import { warning } from './colors.js';

/**
 * Debug output is opt-in via `TASKIN_DEBUG`. Anything that runs as a side
 * effect of a lifecycle command (notifications, auto-sync) must stay quiet by
 * default, so a dead webhook never turns a successful `finish` into noise —
 * but the operator still needs a way to find out why nothing arrived.
 *
 * Accepts any truthy-looking value; `0`, `false` and the empty string are off.
 *
 * @public
 */
export function isDebugEnabled(): boolean {
  const flag = process.env.TASKIN_DEBUG;
  if (flag === undefined) return false;
  const normalized = flag.trim().toLowerCase();
  return normalized !== '' && normalized !== '0' && normalized !== 'false';
}

/**
 * Print a warning only when `TASKIN_DEBUG` is enabled.
 *
 * @public
 */
export function debugWarning(message: string): void {
  if (!isDebugEnabled()) return;
  warning(message);
}
