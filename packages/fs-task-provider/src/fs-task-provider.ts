import type { ITaskProvider, TaskFile } from '@taskin/task-manager';
import { promises as fs } from 'fs';
import path from 'path';

export class FileSystemTaskProvider implements ITaskProvider {
  constructor(private tasksDirectory: string) {}

  async findTask(taskId: string): Promise<TaskFile | undefined> {
    const files = await fs.readdir(this.tasksDirectory);
    const taskFile = files.find(
      (file) => file.startsWith(`task-${taskId}-`) && file.endsWith('.md'),
    );

    if (!taskFile) {
      return undefined;
    }

    const filePath = path.join(this.tasksDirectory, taskFile);
    const content = await fs.readFile(filePath, 'utf-8');

    // This is a simplified parser. A more robust one will be needed.
    const titleMatch = content.match(/^# Task \d+ - (.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';

    const task: TaskFile = {
      id: taskId,
      title,
      content,
      filePath,
      userId: 'unknown',
      status: 'pending',
      type: 'feat',
      createdAt: new Date().toISOString(),
    };

    return task;
  }

  async updateTask(task: TaskFile): Promise<void> {
    // In a real implementation, we would parse the content, update the status,
    // and then write it back to the file.
    await fs.writeFile(task.filePath, task.content);
  }

  async getAllTasks(): Promise<TaskFile[]> {
    // Implementation for getting all tasks would go here.
    return [];
  }
}
