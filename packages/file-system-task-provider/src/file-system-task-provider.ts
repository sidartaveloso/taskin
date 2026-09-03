import type { CreateTaskOptions, ITaskProvider, LintResult, ValidationIssue } from '@opentask/taskin-task-manager';
import type { GroupId, TaskId, TaskStatus, TaskType, User } from '@opentask/taskin-types';
import { parseGroupId, parseTaskId } from '@opentask/taskin-types';
import { slugify } from '@opentask/taskin-utils';
import { promises as fs } from 'fs';
import path from 'path';
import { detectLocale, getI18n, type Locale } from './i18n.js';
import type { CreateTaskFileResult, TaskFile } from './task-file.types.js';
import { createLintResult, fixTaskFile, validateTaskFile } from './task-validator.js';
import type { ILogger, UserRegistry } from './user-registry.js';
import { NullLogger } from './user-registry.js';
import {
  fixUsersFileLocation,
  resolveUsersFilePaths,
  TASKIN_DIR_NAME,
  USERS_FILE_NAME,
  validateUsersFileLocation,
} from './users-file-location.js';

/**
 * Matches the H1 heading `# [🧩] Task NNN — Title`. The separator is anchored
 * right after the task id so a "Task"/"task" inside the title doesn't get
 * matched greedily (e.g. `# Task 031 — revisar se task-manager deveria...`).
 */
const TITLE_PATTERN = /^#\s+(?:🧩\s+)?Task\s+\d+\s*[—-]\s*(.+)$/im;

/**
 * Extracts the numeric task id from a task file name.
 * Accepts both `task-004-my-task.md` and `task-004.md`. Returns `undefined`
 * for anything that is not a numeric task file (e.g. README.md, task-foo.md).
 */
function extractTaskIdFromFileName(fileName: string): string | undefined {
  const match = fileName.match(/^task-(\d+)(?:-.+)?\.md$/);
  return match ? match[1] : undefined;
}

/**
 * Parses the raw inline matches for the prioritization fields (Priority/Group/
 * GroupName/Difficulty) into the typed shape expected on TaskFile.
 */
function parsePrioritizationFields(
  priorityMatch: string | null,
  groupMatch: string | null,
  groupNameMatch: string | null,
  difficultyMatch: string | null,
): {
  order?: number;
  groupId?: GroupId;
  groupName?: string;
  difficulty?: number;
} {
  const order = priorityMatch ? Number(priorityMatch.trim()) : undefined;
  const difficulty = difficultyMatch ? Number(difficultyMatch.trim()) : undefined;

  return {
    ...(order !== undefined && !Number.isNaN(order) && { order }),
    ...(groupMatch && { groupId: parseGroupId(groupMatch.trim()) }),
    ...(groupNameMatch && { groupName: groupNameMatch.trim() }),
    ...(difficulty !== undefined && !Number.isNaN(difficulty) && { difficulty }),
  };
}

/**
 * Upserts or removes a single `Field: value` inline metadata line in the
 * task markdown content, following the same convention used for `Status`.
 * Passing `value === undefined` removes the line if present.
 */
function setInlineField(content: string, fieldName: string, value: string | undefined): string {
  const linePattern = new RegExp(`^${fieldName}:\\s*.+$\\n?`, 'im');

  if (value === undefined) {
    return linePattern.test(content) ? content.replace(linePattern, '') : content;
  }

  if (new RegExp(`^${fieldName}:\\s*.+$`, 'im').test(content)) {
    return content.replace(new RegExp(`^${fieldName}:\\s*.+$`, 'im'), `${fieldName}: ${value}`);
  }

  return content.replace(/(^#.*\n)/, `$1${fieldName}: ${value}\n`);
}

export class FileSystemTaskProvider implements ITaskProvider<TaskFile> {
  private locale: Locale;
  private logger: ILogger;

  constructor(
    private tasksDirectory: string,
    private userRegistry: UserRegistry,
    locale: Locale = 'en-US',
    logger?: ILogger,
  ) {
    this.locale = locale;
    this.logger = logger ?? NullLogger;
  }

  /**
   * A raiz do projeto: o diretório que contém `TASKS/` e `.taskin/`.
   *
   * Derivada do diretório de tasks injetado, e não de `process.cwd()`: o
   * provider é construído com um caminho explícito e usar o cwd fazia o
   * `initialize()` semear arquivos em outro lugar quando os dois divergiam.
   */
  private get projectRoot(): string {
    return path.dirname(path.resolve(this.tasksDirectory));
  }

  async initialize(): Promise<void> {
    // Projeto vindo de uma versão que escrevia o registro na raiz: promove o
    // arquivo antes de decidir se falta semear um.
    const migration = await fixUsersFileLocation(this.projectRoot);
    if (migration.action === 'moved') {
      this.logger.info(`✓ Moved ${USERS_FILE_NAME} into ${TASKIN_DIR_NAME}/${migration.viaGit ? ' (git mv)' : ''}`);
    }

    if (!(await this.pathExists(this.tasksDirectory))) {
      await fs.mkdir(this.tasksDirectory, { recursive: true });
      this.logger.info(`✓ Created ${path.basename(this.tasksDirectory)}/ directory`);
    }

    const { canonical: usersFile } = resolveUsersFilePaths(this.projectRoot);
    if (!(await this.pathExists(usersFile))) {
      const username = process.env.USER || 'developer';
      const usersData = {
        users: {
          [username]: {
            id: username,
            name: username.charAt(0).toUpperCase() + username.slice(1),
            email: `${username}@example.com`,
          },
        },
      };
      await fs.mkdir(path.dirname(usersFile), { recursive: true });
      await fs.writeFile(usersFile, JSON.stringify(usersData, null, 2), 'utf-8');
      this.logger.info(`✓ Created ${TASKIN_DIR_NAME}/${USERS_FILE_NAME} with default user`);
    }
  }

  private async pathExists(target: string): Promise<boolean> {
    try {
      await fs.access(target);
      return true;
    } catch {
      return false;
    }
  }

  async findTask(taskId: TaskId): Promise<TaskFile | undefined> {
    const files = await fs.readdir(this.tasksDirectory);
    const taskFile = files.find((file) => extractTaskIdFromFileName(file) === taskId);

    if (!taskFile) {
      return undefined;
    }

    const filePath = path.join(this.tasksDirectory, taskFile);
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract title from first heading
    const title = content.match(TITLE_PATTERN)?.[1]?.trim() ?? 'Untitled';

    // Auto-detect locale from content if possible, fallback to provider's locale
    const contentLocale = detectLocale(content);
    const i18n = getI18n(contentLocale);

    // Extract metadata from inline format (Status: value)
    // Support both English and localized field names
    const extractInline = (name: string, localizedName?: string): string | null => {
      // Try localized name first, then English name
      const names = localizedName && localizedName !== name ? [localizedName, name] : [name];

      for (const n of names) {
        // Escape special regex characters in field name
        const escapedName = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(`^${escapedName}:\\s*(.+)$`, 'im');
        const captured = content.match(rx)?.[1];
        if (captured !== undefined) return captured.trim();
      }
      return null;
    };

    const statusMatch = extractInline('Status', i18n.status);
    const typeMatch = extractInline('Type', i18n.type);
    const assigneeMatch = extractInline('Assignee', i18n.assignee);
    const priorityMatch = extractInline('Priority', i18n.priority);
    const groupMatch = extractInline('Group', i18n.group);
    const groupNameMatch = extractInline('GroupName', i18n.groupName);
    const difficultyMatch = extractInline('Difficulty', i18n.difficulty);

    // Resolve assignee from registry
    let assignee: User | undefined;
    if (assigneeMatch) {
      const assigneeValue = assigneeMatch.trim();
      assignee = this.userRegistry.resolveUser(assigneeValue);
      if (!assignee) {
        assignee = this.userRegistry.createTemporaryUser(assigneeValue);
      }
    }

    const task: TaskFile = {
      id: parseTaskId(taskId),
      title,
      content,
      // Projects the file body onto the provider-agnostic `description`, so
      // consumers that only speak `Task` (the dashboard, the WebSocket clients)
      // never have to reach for the file-specific `content` field.
      description: content,
      filePath,
      assignee,
      status: (statusMatch ? statusMatch.trim().toLowerCase() : 'pending') as TaskStatus,
      type: (typeMatch ? typeMatch.trim().toLowerCase() : 'feat') as TaskType,
      createdAt: new Date().toISOString(),
      ...parsePrioritizationFields(priorityMatch, groupMatch, groupNameMatch, difficultyMatch),
    };

    return task;
  }

  async updateTask(task: TaskFile): Promise<void> {
    // First, ensure file is migrated to inline format if needed
    const currentContent = await fs.readFile(task.filePath, 'utf-8');
    const hasSectionMetadata = /##\s*(Status|Type|Assignee)/i.test(currentContent);

    if (hasSectionMetadata) {
      const { fixTaskFile } = await import('./task-validator.js');
      await fixTaskFile(task.filePath);
    }

    // Re-read after potential migration
    const content = await fs.readFile(task.filePath, 'utf-8');

    // Update the Status inline metadata
    let updatedContent: string;

    if (/^Status:\s*.+$/im.test(content)) {
      // Replace existing Status line
      updatedContent = content.replace(/^Status:\s*.+$/im, `Status: ${task.status}`);
    } else {
      // If no Status field exists, insert it after the H1 title
      updatedContent = content.replace(/(^#.*\n)/, `$1Status: ${task.status}\n`);
    }

    // Update prioritization fields (manual order, ad hoc group, difficulty)
    updatedContent = setInlineField(
      updatedContent,
      'Priority',
      task.order !== undefined ? String(task.order) : undefined,
    );
    updatedContent = setInlineField(updatedContent, 'Group', task.groupId || undefined);
    updatedContent = setInlineField(updatedContent, 'GroupName', task.groupName || undefined);
    updatedContent = setInlineField(
      updatedContent,
      'Difficulty',
      task.difficulty !== undefined ? String(task.difficulty) : undefined,
    );

    // Write the updated content back to the file
    await fs.writeFile(task.filePath, updatedContent, 'utf-8');
  }

  async getAllTasks(): Promise<TaskFile[]> {
    const files = await fs.readdir(this.tasksDirectory);
    const taskFiles = files.filter((file) => file.startsWith('task-') && file.endsWith('.md'));

    const tasks: TaskFile[] = [];

    for (const file of taskFiles) {
      // `task-foo.md` passa pelo filtro acima mas nao tem id: nao e uma task.
      // Antes virava uma task fantasma de id 'unknown' — e duas delas colidiam.
      const taskId = extractTaskIdFromFileName(file);
      if (!taskId) continue;

      const filePath = path.join(this.tasksDirectory, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract title from first heading
      const title = content.match(TITLE_PATTERN)?.[1]?.trim() ?? 'Untitled';

      // Auto-detect locale from content if possible, fallback to provider's locale
      const contentLocale = detectLocale(content);
      const i18n = getI18n(contentLocale);

      // Extract metadata from inline format (Status: value)
      // Support both English and localized field names
      const extractInline = (name: string, localizedName?: string): string | null => {
        // Try localized name first, then English name
        const names = localizedName && localizedName !== name ? [localizedName, name] : [name];

        for (const n of names) {
          // Escape special regex characters in field name
          const escapedName = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const rx = new RegExp(`^${escapedName}:\\s*(.+)$`, 'im');
          const captured = content.match(rx)?.[1];
          if (captured !== undefined) return captured.trim();
        }
        return null;
      };

      const statusMatch = extractInline('Status', i18n.status);
      const typeMatch = extractInline('Type', i18n.type);
      const assigneeMatch = extractInline('Assignee', i18n.assignee);
      const priorityMatch = extractInline('Priority', i18n.priority);
      const groupMatch = extractInline('Group', i18n.group);
      const groupNameMatch = extractInline('GroupName', i18n.groupName);
      const difficultyMatch = extractInline('Difficulty', i18n.difficulty);

      // Resolve assignee from registry
      let assignee: User | undefined;
      if (assigneeMatch) {
        const assigneeValue = assigneeMatch.trim();
        assignee = this.userRegistry.resolveUser(assigneeValue);
        if (!assignee) {
          assignee = this.userRegistry.createTemporaryUser(assigneeValue);
        }
      }

      const task: TaskFile = {
        id: parseTaskId(taskId),
        title,
        content,
        // See findTask: keeps `description` usable by Task-only consumers.
        description: content,
        filePath,
        assignee,
        status: (statusMatch ? statusMatch.trim().toLowerCase() : 'pending') as TaskStatus,
        type: (typeMatch ? typeMatch.trim().toLowerCase() : 'feat') as TaskType,
        createdAt: new Date().toISOString(),
        ...parsePrioritizationFields(priorityMatch, groupMatch, groupNameMatch, difficultyMatch),
      };

      tasks.push(task);
    }

    return tasks;
  }

  async createTask(options: CreateTaskOptions): Promise<CreateTaskFileResult> {
    // Get all existing tasks to determine next ID and detect locale
    const allTasks = await this.getAllTasks();

    // Detect locale from existing tasks, fallback to provider's locale
    let detectedLocale = this.locale;
    // Get the most recent task (last one in the list)
    const lastTask = allTasks.at(-1);
    if (lastTask) {
      detectedLocale = detectLocale(lastTask.content);
    }

    const i18n = getI18n(detectedLocale);

    const taskNumbers = allTasks
      .map((task) => {
        const digits = task.id.match(/^(\d+)$/)?.[1];
        return digits ? parseInt(digits, 10) : 0;
      })
      .filter((num) => !Number.isNaN(num));

    const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
    const taskId = parseTaskId(String(nextNumber).padStart(3, '0'));

    // Create task file name with slugified title (removes accents)
    const titleSlug = slugify(options.title);

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
    let assignee: User | undefined;
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

${i18n.status}: pending
${i18n.type}: ${type}
${i18n.assignee}: ${assignee}

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

    const allIssues: ValidationIssue[] = [];

    // If fix is enabled, try to fix files first
    if (fix) {
      const migration = await fixUsersFileLocation(this.projectRoot);
      if (migration.action !== 'none') {
        const verb = migration.action === 'moved' ? 'Moved' : 'Parked stale';
        const via = migration.viaGit ? ' (git mv, rename kept in history)' : '';
        allIssues.push({
          file: migration.from ?? this.projectRoot,
          message: `${verb} ${USERS_FILE_NAME} → ${path.relative(this.projectRoot, migration.to ?? '')}${via}`,
          severity: 'info',
        });
        this.logger.info(`✨ ${verb} ${USERS_FILE_NAME} into ${TASKIN_DIR_NAME}/`);
      }

      let fixedCount = 0;
      for (const filePath of taskFiles) {
        const wasFixed = await fixTaskFile(filePath);
        if (wasFixed) {
          fixedCount++;
        }
      }
      if (fixedCount > 0) {
        this.logger.info(`✨ Fixed ${fixedCount} task file(s)`);
      }
    }

    // O registro de usuários fora de lugar não quebra nenhum arquivo de task,
    // mas deixa todo assignee sem resolver — é problema do provider, e é aqui
    // que o usuário tem chance de ver e corrigir.
    allIssues.push(...(await validateUsersFileLocation(this.projectRoot)));

    // Then validate all files
    for (const filePath of taskFiles) {
      const issues = await validateTaskFile(filePath);
      allIssues.push(...issues);
    }

    return createLintResult(allIssues);
  }
}
