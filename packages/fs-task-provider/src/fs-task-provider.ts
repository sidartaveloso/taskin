import type { ITaskProvider, TaskFile } from '@opentask/taskin-task-manager';
import type { TaskId, TaskStatus, TaskType } from '@opentask/taskin-types';
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
      id: taskId satisfies string as TaskId,
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
    const files = await fs.readdir(this.tasksDirectory);
    const taskFiles = files.filter(
      (file) => file.startsWith('task-') && file.endsWith('.md'),
    );

    const tasks: TaskFile[] = [];

    for (const file of taskFiles) {
      const filePath = path.join(this.tasksDirectory, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract task ID from filename: task-001-title.md -> 001
      const idMatch = file.match(/^task-(\d+)-/);
      const taskId = idMatch ? idMatch[1] : 'unknown';

      // Extract title from first heading
      const titleMatch = content.match(/^# .*Task.*?[—-]\s*(.+)$/im);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

      // Try to extract metadata from the header section (before first ##)
      const headerSection = content.split(/^##/m)[0];
      const statusMatch = headerSection.match(/^Status:\s*(.+)$/im);
      const typeMatch = headerSection.match(/^Type:\s*(.+)$/im);
      const userMatch = headerSection.match(/^Assignee:\s*(.+)$/im);

      const task: TaskFile = {
        id: taskId satisfies string as TaskId,
        title,
        content,
        filePath,
        userId: userMatch ? userMatch[1].trim() : undefined,
        status: (statusMatch
          ? statusMatch[1].trim().toLowerCase()
          : 'pending') as TaskStatus,
        type: (typeMatch
          ? typeMatch[1].trim().toLowerCase()
          : 'feat') as TaskType,
        createdAt: new Date().toISOString(),
      };

      tasks.push(task);
    }

    return tasks;
  }
}
