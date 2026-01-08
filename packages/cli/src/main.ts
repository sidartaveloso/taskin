/**
 * Main entry point for Taskin CLI
 * Handles dependency injection and initialization
 */

import {
  FileSystemTaskProvider,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import { TaskManager } from '@opentask/taskin-task-manager';
import { dirname, join } from 'path';
import { FileSystemTaskLinter } from './lib/file-system-task-linter/index.js';
import { Taskin } from './taskin.js';

/**
 * Factory function to create a configured Taskin instance
 */
export function createTaskin(tasksDir?: string): Taskin {
  const resolvedTasksDir = tasksDir || join(process.cwd(), 'TASKS');
  const taskinDir = join(dirname(resolvedTasksDir), '.taskin');

  // Initialize dependencies
  const userRegistry = new UserRegistry({ taskinDir });
  const taskProvider = new FileSystemTaskProvider(
    resolvedTasksDir,
    userRegistry,
  );
  const taskManager = new TaskManager(taskProvider);
  const linter = new FileSystemTaskLinter();

  // Create and return Taskin instance with injected dependencies
  return new Taskin(taskProvider, taskManager, linter);
}

/**
 * Get the default Taskin instance
 * Uses current working directory TASKS folder
 */
export function getTaskin(): Taskin {
  return createTaskin();
}
