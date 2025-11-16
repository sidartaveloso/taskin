import type {
  CreateTaskOptions,
  CreateTaskResult,
  ITaskProvider,
  LintResult,
  TaskFile,
} from '@opentask/taskin-task-manager';
import type { TaskId, TaskStatus, TaskType } from '@opentask/taskin-types';
import { promises as fs } from 'fs';
import path from 'path';
import { detectLocale, getI18n, type Locale } from './i18n.js';
import {
  createLintResult,
  fixTaskFile,
  validateTaskFile,
} from './task-validator.js';
import type { UserRegistry } from './user-registry.js';

export class FileSystemTaskProvider implements ITaskProvider {
  private locale: Locale;

  constructor(
    private tasksDirectory: string,
    private userRegistry: UserRegistry,
    locale: Locale = 'en-US',
  ) {
    this.locale = locale;
  }

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

    // Auto-detect locale from content if possible, fallback to provider's locale
    const contentLocale = detectLocale(content);
    const i18n = getI18n(contentLocale);

    // Extract metadata from section format (## Status, ## Type, ## Assignee)
    // Support both English and localized section names
    const extractSection = (
      name: string,
      localizedName?: string,
    ): string | null => {
      // Try localized name first, then English name
      const names =
        localizedName && localizedName !== name
          ? [localizedName, name]
          : [name];

      for (const n of names) {
        const rx = new RegExp(`##\\s*${n}\\s*\\n\\s*([^\\n\\r]+)`, 'i');
        const m = content.match(rx);
        if (m) return m[1].trim();
      }
      return null;
    };

    const statusMatch = extractSection('Status', i18n.status);
    const typeMatch = extractSection('Type', i18n.type);
    const assigneeMatch = extractSection('Assignee', i18n.assignee);

    // Resolve assignee from registry
    let assignee;
    if (assigneeMatch) {
      const assigneeValue = assigneeMatch.trim();
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
        ? statusMatch.trim().toLowerCase()
        : 'pending') as TaskStatus,
      type: (typeMatch ? typeMatch.trim().toLowerCase() : 'feat') as TaskType,
      createdAt: new Date().toISOString(),
    };

    return task;
  }

  async updateTask(task: TaskFile): Promise<void> {
    // First, ensure file is migrated to section-based format if needed
    const currentContent = await fs.readFile(task.filePath, 'utf-8');
    const hasInlineMetadata = /^(Status|Type|Assignee):\s*.+$/im.test(
      currentContent,
    );

    if (hasInlineMetadata) {
      const { fixTaskFile } = await import('./task-validator.js');
      await fixTaskFile(task.filePath);
    }

    // Re-read after potential migration
    const content = await fs.readFile(task.filePath, 'utf-8');

    // Update the Status section in the content (section-based format)
    let updatedContent: string;

    if (/##\s*Status/i.test(content)) {
      // Replace the line immediately after the '## Status' heading
      updatedContent = content.replace(
        /(##\s*Status\s*\n\s*)([^\n\r]*)/i,
        `$1${task.status}`,
      );
    } else {
      // If no Status section exists, insert it after the H1 title
      updatedContent = content.replace(
        /(^#.*\n)/,
        `$1\n## Status\n${task.status}\n`,
      );
    }

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

      // Auto-detect locale from content if possible, fallback to provider's locale
      const contentLocale = detectLocale(content);
      const i18n = getI18n(contentLocale);

      // Extract metadata from section format (## Status, ## Type, ## Assignee)
      // Support both English and localized section names
      const extractSection = (
        name: string,
        localizedName?: string,
      ): string | null => {
        // Try localized name first, then English name
        const names =
          localizedName && localizedName !== name
            ? [localizedName, name]
            : [name];

        for (const n of names) {
          const rx = new RegExp(`##\\s*${n}\\s*\\n\\s*([^\\n\\r]+)`, 'i');
          const m = content.match(rx);
          if (m) return m[1].trim();
        }
        return null;
      };

      const statusMatch = extractSection('Status', i18n.status);
      const typeMatch = extractSection('Type', i18n.type);
      const assigneeMatch = extractSection('Assignee', i18n.assignee);

      // Resolve assignee from registry
      let assignee;
      if (assigneeMatch) {
        const assigneeValue = assigneeMatch.trim();
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
          ? statusMatch.trim().toLowerCase()
          : 'pending') as TaskStatus,
        type: (typeMatch ? typeMatch.trim().toLowerCase() : 'feat') as TaskType,
        createdAt: new Date().toISOString(),
      };

      tasks.push(task);
    }

    return tasks;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskResult> {
    const i18n = getI18n(this.locale);

    // Get all existing tasks to determine next ID
    const allTasks = await this.getAllTasks();
    const taskNumbers = allTasks
      .map((task) => {
        const match = task.id.match(/^(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const nextNumber =
      taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
    const taskId = String(nextNumber).padStart(3, '0');

    // Create task file name
    const titleSlug = options.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const fileName = `task-${taskId}-${titleSlug}.md`;
    const filePath = path.join(this.tasksDirectory, fileName);

    // Check if file already exists
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      throw new Error(`Task file already exists: ${fileName}`);
    }

    // Resolve assignee from options
    let assignee;
    if (options.assignee) {
      assignee = this.userRegistry.resolveUser(options.assignee);
      if (!assignee) {
        assignee = this.userRegistry.createTemporaryUser(options.assignee);
      }
    }

    // Generate task content using i18n
    const taskContent = this.generateTaskMarkdown({
      id: taskId,
      title: options.title,
      type: options.type,
      description: options.description || '',
      assignee: assignee?.name || i18n.defaultAssignee,
      i18n,
    });

    // Write task file
    await fs.writeFile(filePath, taskContent, 'utf-8');

    // Read back the created task
    const task = await this.findTask(taskId);
    if (!task) {
      throw new Error(`Failed to create task ${taskId}`);
    }

    return {
      task,
      taskId,
      filePath,
    };
  }

  private generateTaskMarkdown(data: {
    id: string;
    title: string;
    type: string;
    description: string;
    assignee: string;
    i18n: ReturnType<typeof getI18n>;
  }): string {
    const { id, title, type, description, assignee, i18n } = data;

    return `# 🧩 Task ${id} — ${title}

## ${i18n.status}

pending

## ${i18n.type}

${type}

## ${i18n.assignee}

${assignee}

## ${i18n.description}

${description || i18n.descriptionPlaceholder}

## ${i18n.tasks}

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## ${i18n.notes}

${i18n.notesPlaceholder}
`;
  }

  async lint(fix?: boolean): Promise<LintResult> {
    const files = await fs.readdir(this.tasksDirectory);
    const taskFiles = files
      .filter((file) => file.startsWith('task-') && file.endsWith('.md'))
      .map((file) => path.join(this.tasksDirectory, file));

    // If fix is enabled, try to fix files first
    if (fix) {
      let fixedCount = 0;
      for (const filePath of taskFiles) {
        const wasFixed = await fixTaskFile(filePath);
        if (wasFixed) {
          fixedCount++;
        }
      }
      if (fixedCount > 0) {
        console.log(`✨ Fixed ${fixedCount} task file(s)`);
      }
    }

    // Then validate all files
    const allIssues = [];
    for (const filePath of taskFiles) {
      const issues = await validateTaskFile(filePath);
      allIssues.push(...issues);
    }

    return createLintResult(allIssues);
  }
}
