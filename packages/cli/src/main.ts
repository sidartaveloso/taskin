/**
 * Main entry point for Taskin CLI
 * Handles dependency injection and initialization
 */

import { TaskManager } from '@opentask/taskin-task-manager';
import { FileSystemTaskLinter } from './lib/file-system-task-linter/index.js';
import { resolveTaskProvider } from './lib/provider-factory/index.js';
import { Taskin } from './taskin.js';

/**
 * Factory function to create a configured Taskin instance.
 *
 * Async because the provider comes from `.taskin.json` — which provider is in
 * play is a runtime question, and its user directory has to be loaded before
 * anything reads a task.
 *
 * @param tasksDir - Overrides where the provider looks for tasks
 */
export async function createTaskin(tasksDir?: string): Promise<Taskin> {
  const { provider } = await resolveTaskProvider(tasksDir ? { tasksDir } : {});

  const taskManager = new TaskManager(provider);
  const linter = new FileSystemTaskLinter();

  return new Taskin(provider, taskManager, linter);
}

/**
 * Get the default Taskin instance
 * Uses the provider configured in .taskin.json
 */
export function getTaskin(): Promise<Taskin> {
  return createTaskin();
}
