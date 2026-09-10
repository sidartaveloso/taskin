import type {
  CreateTaskOptions,
  ITaskProvider,
  IUserRegistry,
  LintResult,
  ValidationIssue,
} from '@opentask/taskin-task-manager';
import type { GroupId, TaskId, TaskStatus, TaskType, User } from '@opentask/taskin-types';
import { parseGroupId, parseTaskId } from '@opentask/taskin-types';
import { slugify } from '@opentask/taskin-utils';
import { promises as fs } from 'fs';
import path from 'path';
import { fixAssignees, validateAssignees, validateSeededUsers } from './assignee-identity.js';
import { detectLocale, getI18n, type Locale } from './i18n.js';
import {
  DEFAULT_METADATA_STYLE_ID,
  getMetadataStyle,
  type MetadataStyleId,
  readMetadataField,
  resolveMetadataStyle,
} from './metadata-style/index.js';
import type { CreateTaskFileResult, TaskFile } from './task-file.types.js';
import { createLintResult, fixTaskFile, validateTaskFile } from './task-validator.js';
import type { ILogger } from './user-registry.js';
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
  priorityMatch: string | undefined,
  groupMatch: string | undefined,
  groupNameMatch: string | undefined,
  difficultyMatch: string | undefined,
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
 * Upserts or removes a single `Field: value` line in the metadata block,
 * keeping whatever marking style the file is already written in.
 *
 * Passing `value === undefined` removes the line if present.
 */
function setInlineField(
  content: string,
  fieldName: string,
  value: string | undefined,
  fallbackStyle: MetadataStyleId,
): string {
  return resolveMetadataStyle(content, fallbackStyle).write(content, fieldName, value);
}

/**
 * Options that are not part of the provider contract but change how this
 * provider writes.
 *
 * @public
 */
export interface FileSystemTaskProviderOptions {
  /**
   * Marking style for files this provider creates.
   *
   * Only for creation: an edit follows the style of the file being edited, so
   * a project that switches the setting does not end up with files half in one
   * style and half in another.
   */
  readonly metadataStyle?: MetadataStyleId;

  /**
   * When set, `lint(fix)` rewrites every file's metadata block into this
   * style. Left unset — the default — `lint(fix)` normalizes each file within
   * the style it already uses.
   */
  readonly convertMetadataStyleTo?: MetadataStyleId;
}

export class FileSystemTaskProvider implements ITaskProvider<TaskFile> {
  private locale: Locale;
  private logger: ILogger;
  private metadataStyle: MetadataStyleId;
  private convertMetadataStyleTo: MetadataStyleId | undefined;

  constructor(
    private tasksDirectory: string,
    private userRegistry: IUserRegistry,
    locale: Locale = 'en-US',
    logger?: ILogger,
    options: FileSystemTaskProviderOptions = {},
  ) {
    this.locale = locale;
    this.logger = logger ?? NullLogger;
    this.metadataStyle = options.metadataStyle ?? DEFAULT_METADATA_STYLE_ID;
    this.convertMetadataStyleTo = options.convertMetadataStyleTo;
  }

  /**
   * Reads the metadata a task file carries, whatever style it is written in
   * and whichever of the two locales named the fields.
   */
  private readInlineMetadata(content: string): {
    status?: string;
    type?: string;
    assignee?: string;
    priority?: string;
    group?: string;
    groupName?: string;
    difficulty?: string;
  } {
    const i18n = getI18n(detectLocale(content));
    const read = (english: string, localized: string) => readMetadataField(content, localized, english);

    return {
      status: read('Status', i18n.status),
      type: read('Type', i18n.type),
      assignee: read('Assignee', i18n.assignee),
      priority: read('Priority', i18n.priority),
      group: read('Group', i18n.group),
      groupName: read('GroupName', i18n.groupName),
      difficulty: read('Difficulty', i18n.difficulty),
    };
  }

  /**
   * The label to write a field under: the one the file already uses, or the
   * English name.
   *
   * Without this, writing `Prioridade` into a file that already says
   * `Priority` appends a second line instead of updating the first.
   */
  private labelFor(content: string, english: string, localized: string): string {
    if (readMetadataField(content, localized) !== undefined) return localized;
    return english;
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

  /**
   * Reads the `Assignee:` line as written, before the registry gets a say.
   *
   * `getAllTasks` already replaces an unresolvable assignee with a fabricated
   * temporary user, which is exactly what the lint has to see through.
   */
  private readAssigneeLine(content: string): string | undefined {
    const i18n = getI18n(detectLocale(content));
    return readMetadataField(content, 'Assignee', i18n.assignee);
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

    const {
      status: statusMatch,
      type: typeMatch,
      assignee: assigneeMatch,
      priority: priorityMatch,
      group: groupMatch,
      groupName: groupNameMatch,
      difficulty: difficultyMatch,
    } = this.readInlineMetadata(content);

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
      await fixTaskFile(task.filePath, { metadataStyle: this.metadataStyle });
    }

    // Re-read after potential migration
    const content = await fs.readFile(task.filePath, 'utf-8');

    /*
     * Todas as escritas passam pelo estilo do arquivo, resolvido uma vez. O
     * `Status` usa o rotulo localizado que o arquivo ja tem: reescrever
     * `Responsável` como `Assignee` era o jeito rapido de transformar um
     * arquivo pt-BR num arquivo com dois campos de responsavel.
     */
    const i18n = getI18n(detectLocale(content));
    const style = resolveMetadataStyle(content, this.metadataStyle);

    let updatedContent = style.write(content, this.labelFor(content, 'Status', i18n.status), task.status);

    // Update prioritization fields (manual order, ad hoc group, difficulty)
    updatedContent = setInlineField(
      updatedContent,
      this.labelFor(updatedContent, 'Priority', i18n.priority),
      task.order !== undefined ? String(task.order) : undefined,
      this.metadataStyle,
    );
    updatedContent = setInlineField(
      updatedContent,
      this.labelFor(updatedContent, 'Group', i18n.group),
      task.groupId || undefined,
      this.metadataStyle,
    );
    updatedContent = setInlineField(
      updatedContent,
      this.labelFor(updatedContent, 'GroupName', i18n.groupName),
      task.groupName || undefined,
      this.metadataStyle,
    );
    updatedContent = setInlineField(
      updatedContent,
      this.labelFor(updatedContent, 'Difficulty', i18n.difficulty),
      task.difficulty !== undefined ? String(task.difficulty) : undefined,
      this.metadataStyle,
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

      const {
        status: statusMatch,
        type: typeMatch,
        assignee: assigneeMatch,
        priority: priorityMatch,
        group: groupMatch,
        groupName: groupNameMatch,
        difficulty: difficultyMatch,
      } = this.readInlineMetadata(content);

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

    const metadata = getMetadataStyle(this.metadataStyle).format([
      { label: i18n.status, value: 'pending' },
      { label: i18n.type, value: type },
      { label: i18n.assignee, value: assignee },
    ]);

    return `# 🧩 Task ${id} — ${title}

${metadata}

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

      const tasksBeforeFix = await this.getAllTasks();
      const corrected = await fixAssignees(
        tasksBeforeFix.map((task) => ({ file: task.filePath, assignee: this.readAssigneeLine(task.content) })),
        this.userRegistry,
        {
          readFile: (target) => fs.readFile(target, 'utf-8'),
          writeFile: (target, content) => fs.writeFile(target, content, 'utf-8'),
        },
      );
      if (corrected.length > 0) {
        this.logger.info(`✨ Corrected the assignee of ${corrected.length} task file(s)`);
      }

      let fixedCount = 0;
      for (const filePath of taskFiles) {
        const wasFixed = await fixTaskFile(filePath, {
          metadataStyle: this.metadataStyle,
          ...(this.convertMetadataStyleTo !== undefined && { convertTo: this.convertMetadataStyleTo }),
        });
        if (wasFixed) {
          fixedCount++;
        }
      }
      if (fixedCount > 0) {
        this.logger.info(`✨ Fixed ${fixedCount} task file(s)`);
      }
    }

    // Assignee que nao resolve nao quebra o arquivo, mas vira usuario temporario
    // fabricado — invisivel na tela e contado como pessoa nas metricas.
    const tasks = await this.getAllTasks();
    const assignees = tasks.map((task) => ({ file: task.filePath, assignee: this.readAssigneeLine(task.content) }));
    allIssues.push(...validateAssignees(assignees, this.userRegistry));
    allIssues.push(
      ...validateSeededUsers(
        assignees.map((entry) => entry.assignee),
        this.userRegistry,
      ),
    );

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
