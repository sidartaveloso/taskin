import type { Task, TaskId, TaskStatus } from '@opentask/taskin-types';
import type {
  CreateTaskOptions,
  CreateTaskResult,
  ITaskManager,
  ITaskProvider,
  LintResult,
} from './task-manager.types';

/**
 * Orchestrates task state transitions on top of any {@link ITaskProvider}.
 *
 * `TTask` is inferred from the provider passed to the constructor, so callers
 * get their provider's task shape back without this class ever naming it.
 */
export class TaskManager<TTask extends Task = Task> implements ITaskManager<TTask> {
  constructor(private taskProvider: ITaskProvider<TTask>) {}

  /**
   * Returns a copy of `task` with a new status.
   *
   * TypeScript cannot prove that spreading a generic yields that same generic,
   * so the assertion is required. It is sound here: `status` is a known key of
   * `Task`, and every other field is carried over untouched.
   */
  private withStatus(task: TTask, status: TaskStatus): TTask {
    return { ...task, status } as TTask;
  }

  async startTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    if (task.status === 'in-progress') {
      throw new Error(`Task '${taskId}' is already in progress.`);
    }

    if (task.status === 'done') {
      throw new Error(`Task '${taskId}' is already done.`);
    }

    const updatedTask = this.withStatus(task, 'in-progress');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async pauseTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(`Task '${taskId}' must be in 'in-progress' status to be paused. Current status: ${task.status}`);
    }

    const updatedTask = this.withStatus(task, 'paused');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  /**
   * Every task the configured provider knows about.
   *
   * Pass-through on purpose: the manager owns the state transitions, not the
   * storage. Having it here is what lets a consumer holding only the manager —
   * the MCP server — answer "what work exists?".
   */
  async getAllTasks(): Promise<TTask[]> {
    return await this.taskProvider.getAllTasks();
  }

  async finishTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    const updatedTask = this.withStatus(task, 'done');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async reviewTask(taskId: TaskId): Promise<TTask> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    if (task.status !== 'in-progress') {
      throw new Error(
        `Task '${taskId}' must be in 'in-progress' status to be reviewed. Current status: ${task.status}`,
      );
    }

    const updatedTask = this.withStatus(task, 'in-review');
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult<TTask>> {
    return this.taskProvider.createTask(options);
  }

  async lint(fix?: boolean): Promise<LintResult> {
    return this.taskProvider.lint(fix);
  }
}
