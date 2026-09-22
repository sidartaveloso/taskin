/**
 * Taskin - Concrete implementation of ITaskin
 * Main class that implements task management with dependency injection
 */

import type { ITaskManager, ITaskProvider } from '@opentask/taskin-task-manager';
import type {
  FinishTaskOptions,
  ITaskin,
  LintResult,
  LintTasksOptions,
  ListTasksOptions,
  PauseTaskOptions,
  StartTaskOptions,
  Task,
  TaskId,
} from '@opentask/taskin-types';
import type { FileSystemTaskLinter } from './lib/file-system-task-linter/file-system-task-linter.js';
import type { OpaqueTask } from './lib/provider-factory/index.js';

export class Taskin implements ITaskin {
  constructor(
    private readonly taskProvider: ITaskProvider<OpaqueTask>,
    private readonly taskManager: ITaskManager<OpaqueTask>,
    private readonly linter: FileSystemTaskLinter,
  ) {}

  async list(options?: ListTasksOptions): Promise<Task[]> {
    const tasks = await this.taskProvider.getAllTasks();

    // Project the provider's shape down to Task and apply filters
    return tasks
      .map((taskFile) => {
        const task: Task = {
          createdAt: taskFile.createdAt,
          id: taskFile.id as TaskId,
          status: taskFile.status,
          title: taskFile.title,
          type: taskFile.type,
          ...(taskFile.userId && { userId: taskFile.userId }), // Keep userId if present
        };
        return task;
      })
      .filter((task) => {
        if (options?.status && task.status !== options.status) {
          return false;
        }
        if (options?.type && task.type !== options.type) {
          return false;
        }
        if (options?.assignee && task.userId !== options.assignee) {
          return false;
        }
        return true;
      });
  }

  async start(taskId: TaskId, options?: StartTaskOptions): Promise<void> {
    const task = await this.taskProvider.findTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.taskManager.startTask(taskId);

    // TODO: Handle options.force and options.base when git integration is ready
    if (options?.force) {
      // Force start implementation
    }
    if (options?.base) {
      // Base branch implementation
    }
  }

  async pause(taskId: TaskId, options?: PauseTaskOptions): Promise<void> {
    const task = await this.taskProvider.findTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // TODO: Implement pause logic with git operations
    if (!options?.skipCommit) {
      // Commit changes
      task.status = 'pending';
      await this.taskProvider.updateTask(task);
    }

    if (options?.message) {
      // Use custom commit message
    }
  }

  async finish(taskId: TaskId, _options?: FinishTaskOptions): Promise<void> {
    const task = await this.taskProvider.findTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    await this.taskManager.finishTask(taskId);
  }

  async lint(options?: LintTasksOptions): Promise<LintResult> {
    const lintPath = options?.path || 'TASKS';
    const fileResult = await this.linter.lintDirectory(lintPath);

    // Convert FileSystem-specific result to provider-agnostic result
    return {
      errors: fileResult.errors.map((e) => ({
        taskId: e.file,
        message: e.message,
        severity: e.severity,
        line: e.line,
      })),
      warnings: fileResult.warnings.map((e) => ({
        taskId: e.file,
        message: e.message,
        severity: e.severity,
        line: e.line,
      })),
      tasksChecked: fileResult.filesChecked,
      valid: fileResult.valid,
    };
  }
}
