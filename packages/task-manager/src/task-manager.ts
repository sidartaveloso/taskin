import type {
  ITaskManager,
  ITaskProvider,
  TaskFile,
} from './task-manager.types';

export class TaskManager implements ITaskManager {
  constructor(private taskProvider: ITaskProvider) {}

  async startTask(taskId: string): Promise<TaskFile> {
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

    const updatedTask: TaskFile = { ...task, status: 'in-progress' };
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }

  async finishTask(taskId: string): Promise<TaskFile> {
    const task = await this.taskProvider.findTask(taskId);

    if (!task) {
      throw new Error(`Task with ID '${taskId}' not found.`);
    }

    const updatedTask: TaskFile = { ...task, status: 'done' };
    await this.taskProvider.updateTask(updatedTask);

    return updatedTask;
  }
}
