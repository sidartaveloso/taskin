import type { Task, User } from '@taskin/types-ts';

export type TaskStatus = 'pending' | 'in-progress' | 'done' | 'blocked';

export type TaskType = 'feat' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';

export type TaskFile = Task & {
  content: string;
  filePath: string;
  type: TaskType;
  assignee?: User;
};

export interface ITaskProvider {
  findTask(taskId: string): Promise<TaskFile | undefined>;
  getAllTasks(): Promise<TaskFile[]>;
  updateTask(task: TaskFile): Promise<void>;
}
