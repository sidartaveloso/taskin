/**
 * The seam that makes the MCP path honor `automation.level`.
 *
 * `taskin start`/`finish` auto-commit the status change when the project's
 * automation asks for it; the MCP `start_task`/`finish_task` used to change the
 * status and touch nothing else, so the same operation left a different history
 * depending on which door you went through (task-066). The fix keeps the
 * `@opentask/taskin-task-server-mcp` package git-agnostic — it only calls an
 * injected `onStatusChange` hook — and builds that hook here, in the CLI, where
 * the config and git already live. The commit produced is byte-for-byte the one
 * `commitTaskStatusChangeOnBranch` writes for the CLI, so the two doors agree.
 */

import { GitService, type IGitService } from '@opentask/taskin-git-utils';
import type { TaskStatusChangeHook } from '@opentask/taskin-task-server-mcp';
import { ConfigManager } from '../config-manager.js';

export interface McpStatusCommitHookOptions {
  /** Project root that holds `.taskin.json`, used to resolve automation. */
  monorepoRoot: string;
  /** Working directory git runs in. Defaults to `process.cwd()`. */
  cwd?: string;
  /** Injected git service, for tests. Defaults to a real `GitService`. */
  gitService?: IGitService;
}

/**
 * Build the `onStatusChange` hook the MCP server calls after `start_task` and
 * `finish_task`. Returns `undefined` when the project's automation does not
 * auto-commit status changes (e.g. `automation.level: manual`), so no hook is
 * wired and the MCP path stays a pure status change — exactly what the CLI does
 * in the same project.
 */
export function createMcpStatusCommitHook(options: McpStatusCommitHookOptions): TaskStatusChangeHook | undefined {
  const behavior = new ConfigManager(options.monorepoRoot).getAutomationBehavior();

  if (!behavior.autoCommitStatusChange) {
    return undefined;
  }

  const git = options.gitService ?? new GitService(options.cwd ?? process.cwd(), { ciSkipTag: behavior.ciSkipTag });

  return async ({ taskId, status }) => {
    await git.commitTaskStatusChangeOnBranch(taskId, status, behavior.defaultBranch);
  };
}
