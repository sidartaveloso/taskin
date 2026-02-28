/**
 * Mock implementation of IHookRunner for testing.
 * Provides configurable behavior for testing hook execution scenarios.
 */

import type {
  HookContext,
  HookOptions,
  HookResult,
  IHookRunner,
} from '@opentask/taskin-types';

/**
 * Mock hook runner for testing.
 * Allows simulating successful or failed hook execution.
 *
 * @public
 * @example
 * ```ts
 * const mockRunner = new MockHookRunner();
 * mockRunner.setResults([
 *   { hook: 'pnpm lint', success: true, duration: 100 },
 *   { hook: 'pnpm test', success: false, error: 'Test failed', duration: 200 }
 * ]);
 * ```
 */
export class MockHookRunner implements IHookRunner {
  private mockResults: HookResult[] = [];
  private executedHooks: Array<{
    hooks: string[];
    context: HookContext;
    options: HookOptions;
  }> = [];

  /**
   * Execute hooks (mocked).
   * Returns pre-configured results.
   */
  async executeHooks(
    hooks: string[],
    context: HookContext,
    options: HookOptions,
  ): Promise<HookResult[]> {
    // Store execution for verification
    this.executedHooks.push({ hooks, context, options });

    // Return mock results or generate default success results
    if (this.mockResults.length > 0) {
      return this.mockResults;
    }

    // Default: all hooks succeed
    return hooks.map((hook) => ({
      hook,
      success: true,
      output: `Mock output for: ${hook}`,
      duration: 100,
    }));
  }

  /**
   * Set mock results to return on next execution.
   *
   * @param results - Array of mock hook results
   */
  setResults(results: HookResult[]): void {
    this.mockResults = results;
  }

  /**
   * Get history of executed hooks.
   *
   * @returns Array of hook executions
   */
  getExecutionHistory(): Array<{
    hooks: string[];
    context: HookContext;
    options: HookOptions;
  }> {
    return this.executedHooks;
  }

  /**
   * Reset mock state.
   */
  reset(): void {
    this.mockResults = [];
    this.executedHooks = [];
  }

  /**
   * Check if hooks were executed.
   *
   * @returns True if any hooks were executed
   */
  wasExecuted(): boolean {
    return this.executedHooks.length > 0;
  }

  /**
   * Get the last execution.
   *
   * @returns Last hook execution or undefined
   */
  getLastExecution():
    | { hooks: string[]; context: HookContext; options: HookOptions }
    | undefined {
    return this.executedHooks[this.executedHooks.length - 1];
  }
}
