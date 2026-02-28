/**
 * Hook runner implementation for executing lifecycle hooks.
 * Implements IHookRunner interface with sequential execution and template substitution.
 */

import type {
  HookContext,
  HookOptions,
  HookResult,
  IHookRunner,
} from '@opentask/taskin-types';
import { execSync } from 'child_process';

/**
 * Implementation of IHookRunner.
 * Executes shell commands sequentially with template variable substitution.
 *
 * @public
 * @example
 * ```ts
 * const hook Runner = new HookRunner();
 * const results = await hookRunner.executeHooks(
 *   ['pnpm lint', 'pnpm test'],
 *   { taskId: '014', taskTitle: 'Add review' },
 *   { timeout: 60000, continueOnError: false, cwd: '.' }
 * );
 *
 * const allPassed = results.every(r => r.success);
 * ```
 */
export class HookRunner implements IHookRunner {
  /**
   * Execute a list of hooks sequentially.
   *
   * @param hooks - Array of shell commands to execute
   * @param context - Context with variables for template substitution
   * @param options - Execution options (timeout, error handling)
   * @returns Array of results for each executed hook
   */
  async executeHooks(
    hooks: string[],
    context: HookContext,
    options: HookOptions,
  ): Promise<HookResult[]> {
    const results: HookResult[] = [];

    for (const hook of hooks) {
      const startTime = Date.now();
      const command = this.substituteVariables(hook, context);

      try {
        const output = this.execWithTimeout(command, options);

        results.push({
          hook,
          success: true,
          output: output.toString().trim(),
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          hook,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        });

        // Stop execution if continueOnError is false
        if (!options.continueOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Substitute template variables in hook command.
   * Replaces {{variableName}} with values from context.
   *
   * @param hook - Hook command with template variables
   * @param context - Context containing variable values
   * @returns Command with substituted values
   *
   * @private
   */
  private substituteVariables(hook: string, context: HookContext): string {
    let result = hook;

    for (const [key, value] of Object.entries(context)) {
      // Only substitute if value is defined
      if (value !== undefined) {
        const pattern = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(pattern, value);
      }
    }

    return result;
  }

  /**
   * Execute command with timeout.
   *
   * @param command - Shell command to execute
   * @param options - Execution options
   * @returns Command output as Buffer
   *
   * @private
   */
  private execWithTimeout(command: string, options: HookOptions): Buffer {
    return execSync(command, {
      cwd: options.cwd,
      timeout: options.timeout,
      encoding: 'buffer',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }
}
