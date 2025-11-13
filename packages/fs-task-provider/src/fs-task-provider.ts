import type { ITaskProvider, TaskFile } from '@opentask/taskin-task-manager';
import type { TaskId, TaskStatus, TaskType } from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import path from 'path';
import type { UserRegistry } from './user-registry.js';

export class FileSystemTaskProvider implements ITaskProvider {
  constructor(
    private tasksDirectory: string,
    private userRegistry: UserRegistry,
  ) {}

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

    // Extract title from first heading
    const titleMatch = content.match(/^# .*Task.*?[—-]\s*(.+)$/im);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Try to extract metadata from the header section (before first ##)
    const headerSection = content.split(/^##/m)[0];
    const statusMatch = headerSection.match(/^Status:\s*(.+)$/im);
    const typeMatch = headerSection.match(/^Type:\s*(.+)$/im);
    const assigneeMatch = headerSection.match(/^Assignee:\s*(.+)$/im);

    // Resolve assignee from registry
    let assignee;
    if (assigneeMatch) {
      const assigneeValue = assigneeMatch[1].trim();
      // Try to resolve from registry
      assignee = this.userRegistry.resolveUser(assigneeValue);

      // Fallback: create temporary user if not in registry
      if (!assignee) {
        console.warn(
          `[FS Provider] User "${assigneeValue}" not found in registry, creating temporary user`,
        );
        assignee = this.userRegistry.createTemporaryUser(assigneeValue);
      }
    }

    const task: TaskFile = {
      id: taskId satisfies string as TaskId,
      title,
      content,
      filePath,
      assignee,
      status: (statusMatch
        ? statusMatch[1].trim().toLowerCase()
        : 'pending') as TaskStatus,
      type: (typeMatch
        ? typeMatch[1].trim().toLowerCase()
        : 'feat') as TaskType,
      createdAt: new Date().toISOString(),
    };

    return task;
  }

  async updateTask(task: TaskFile): Promise<void> {
    // Read the current file content
    const currentContent = await fs.readFile(task.filePath, 'utf-8');

    // Update the Status field in the content
    const updatedContent = currentContent.replace(
      /^Status:\s*.+$/im,
      `Status: ${task.status}`,
    );

    // Write the updated content back to the file
    await fs.writeFile(task.filePath, updatedContent, 'utf-8');
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
      const assigneeMatch = headerSection.match(/^Assignee:\s*(.+)$/im);

      // Resolve assignee from registry
      let assignee;
      if (assigneeMatch) {
        const assigneeValue = assigneeMatch[1].trim();
        // Try to resolve from registry
        assignee = this.userRegistry.resolveUser(assigneeValue);

        // Fallback: create temporary user if not in registry
        if (!assignee) {
          assignee = this.userRegistry.createTemporaryUser(assigneeValue);
        }
      }

      const task: TaskFile = {
        id: taskId satisfies string as TaskId,
        title,
        content,
        filePath,
        assignee,
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
