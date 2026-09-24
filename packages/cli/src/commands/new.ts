/**
 * New command - Create a new task
 */

import { pushAfterCreate, syncBeforeCreate } from '@opentask/taskin-file-system-provider';
import { GitService, type IGitService } from '@opentask/taskin-git-utils';
import { GROUPS_NOT_SUPPORTED, type IGroupRegistry, TaskManager } from '@opentask/taskin-task-manager';
import { parseGroupId, TASK_TYPES } from '@opentask/taskin-types';
import inquirer from 'inquirer';
import path from 'path';
import { resolveCiSkipTag } from '../lib/ci-skip-tag/index.js';
import { colors, error, info, printHeader, success, warning } from '../lib/colors.js';
import { ConfigManager } from '../lib/config-manager.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';
import { lerPrioridade } from './priority.js';

interface CreateTaskOptions {
  type?: string;
  title?: string;
  description?: string;
  user?: string;
  /** `false` com --no-skip-ci: nao marca o commit de status. */
  skipCi?: boolean;
  /** Id de um grupo que ja existe. */
  group?: string;
  /** Numero de prioridade, como digitado. */
  priority?: string;
}

export const createCommand = defineCommand({
  name: 'new',
  description: '➕ Create a new task',
  alias: 'create',
  options: [
    {
      flags: '-t, --type <type>',
      description: 'Task type (feat, fix, refactor, docs, test, chore)',
    },
    {
      flags: '-T, --title <title>',
      description: 'Task title',
    },
    {
      flags: '-d, --description <description>',
      description: 'Task description',
    },
    {
      flags: '-u, --user <user>',
      description: 'Assignee user',
    },
    {
      flags: '-g, --group <group-id>',
      description: 'Put the new task in this existing group',
    },
    {
      flags: '-p, --priority <n>',
      description: 'Give the new task this priority number (lower comes first)',
    },
    {
      flags: '--no-skip-ci',
      description: 'Write the status commit without the CI-skip tag',
    },
  ],
  handler: async (options: CreateTaskOptions) => {
    await createTask(options);
  },
});

export async function createTask(options: CreateTaskOptions, gitService?: IGitService): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  printHeader('Create New Task', '➕');

  // Derivado do dominio para nao divergir de TaskType
  const validTypes: readonly string[] = TASK_TYPES;

  // If no options provided, enter interactive mode
  if (!options.type && !options.title) {
    info('Interactive mode - Answer the questions below:');
    console.log();

    const answers = await inquirer.prompt<{
      title: string;
      type: string;
      description?: string;
      user?: string;
    }>([
      {
        type: 'list',
        name: 'type',
        message: 'Select task type:',
        choices: [
          { name: '✨ feat - New feature', value: 'feat' },
          { name: '🐛 fix - Bug fix', value: 'fix' },
          { name: '♻️  refactor - Code refactoring', value: 'refactor' },
          { name: '📝 docs - Documentation', value: 'docs' },
          { name: '✅ test - Tests', value: 'test' },
          { name: '🔧 chore - Maintenance', value: 'chore' },
        ],
        default: 'feat',
      },
      {
        type: 'input',
        name: 'title',
        message: 'Task title:',
        validate: (input: string) => {
          if (input.trim().length === 0) {
            return 'Title is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Task description (optional):',
      },
      {
        type: 'input',
        name: 'user',
        message: 'Assignee (optional):',
        default: 'A definir',
      },
    ]);

    // Merge answers into options
    options.type = answers.type;
    options.title = answers.title;
    options.description = answers.description;
    options.user = answers.user;

    console.log();
  }

  // Validate required options
  if (!options.type) {
    error('Task type is required. Use --type <type>');
    return;
  }

  if (!options.title) {
    error('Task title is required. Use --title <title>');
    return;
  }

  // Validate task type. O find estreita para TaskType sem asserção.
  const taskType = TASK_TYPES.find((candidate) => candidate === options.type);
  if (!taskType) {
    error(`Invalid task type: ${options.type}. Must be one of: ${validTypes.join(', ')}`);
    return;
  }

  // Prioridade vem digitada; conferir antes de haver arquivo para desfazer.
  let priority: number | undefined;
  if (options.priority !== undefined) {
    try {
      priority = lerPrioridade(options.priority);
    } catch (invalida) {
      error(invalida instanceof Error ? invalida.message : String(invalida));
      process.exitCode = 1;
      return;
    }
  }

  const { provider: taskProvider, userRegistry, projectRoot: monorepoRoot } = await resolveTaskProvider();
  await taskProvider.initialize();

  /*
   * O grupo tambem e conferido antes de criar: uma tarefa que nasce e depois
   * falha ao entrar no grupo deixa um arquivo que ninguem pediu daquele jeito.
   */
  const groupId = options.group !== undefined ? parseGroupId(options.group) : undefined;
  if (groupId) {
    const registro = (taskProvider as { groupRegistry?: IGroupRegistry }).groupRegistry;
    if (!registro) {
      error(GROUPS_NOT_SUPPORTED);
      process.exitCode = 1;
      return;
    }
    if (!(await registro.findGroup(groupId))) {
      error(`Group '${groupId}' does not exist. See "taskin group list".`);
      process.exitCode = 1;
      return;
    }
  }

  // Ensure the current user exists in the registry
  await userRegistry.ensureCurrentUser();

  // Load automation config
  const configManager = new ConfigManager(monorepoRoot);
  const behavior = configManager.getAutomationBehavior();
  const ciSkipTag = resolveCiSkipTag(behavior.ciSkipTag, options.skipCi);
  const autoSyncActive = behavior.autoSync && !!behavior.defaultBranch;

  if (behavior.autoSync && !behavior.defaultBranch) {
    warning('autoSync is enabled but no defaultBranch is configured. Nothing will be synced.');
  }

  // Initialize Git service
  const git = gitService ?? new GitService(process.cwd(), { ciSkipTag });

  // Sync with remote before numbering (fetch + rebase) when autoSync is active
  if (autoSyncActive) {
    try {
      await syncBeforeCreate(git, {
        autoSync: autoSyncActive,
        defaultBranch: behavior.defaultBranch,
      });
      info('Synced with remote before numbering.');
    } catch (syncError) {
      error(syncError instanceof Error ? `Sync failed: ${syncError.message}` : 'Sync failed. Aborting task creation.');
      return;
    }
  }

  /*
   * Quem decide o id e o provider, nao o comando: `max(ids)+1` sobre os
   * arquivos e semantica de sistema de arquivos, e num provider remoto o id vem
   * do proprio store (o numero da issue). O comando so consome o que voltou.
   */
  let created: Awaited<ReturnType<typeof taskProvider.createTask>>;
  try {
    created = await taskProvider.createTask({
      title: options.title,
      type: taskType,
      ...(options.description && { description: options.description }),
      ...(options.user && { assignee: options.user }),
    });
  } catch (createError) {
    error(createError instanceof Error ? createError.message : 'Failed to create task');
    return;
  }

  const taskId = created.task.id;

  // Antes do push: o commit do autoSync ja leva a tarefa no lugar.
  const manager = new TaskManager(taskProvider);
  if (groupId) await manager.assignToGroup(taskId, groupId);
  if (priority !== undefined) await manager.setPriority(taskId, priority);

  const createdPath = 'filePath' in created && typeof created.filePath === 'string' ? created.filePath : undefined;

  // Commit and push the new task when autoSync is active
  if (autoSyncActive && behavior.defaultBranch) {
    try {
      await pushAfterCreate(git, {
        taskId,
        title: options.title,
        defaultBranch: behavior.defaultBranch,
        ciSkipTag,
      });
    } catch (pushError) {
      error(
        pushError instanceof Error
          ? `Push failed: ${pushError.message}`
          : 'Push failed. Task file was created but not pushed.',
      );
      return;
    }
  }

  // Show success message
  console.log();
  success(`Task ${taskId} created successfully!`);
  console.log(colors.secondary(`📝 Title: ${created.task.title}`));
  if (createdPath) {
    console.log(colors.secondary(`📁 Path: ${createdPath}`));
  }
  if (groupId) {
    console.log(colors.secondary(`🗂️  Group: ${groupId}`));
  }
  if (priority !== undefined) {
    console.log(colors.secondary(`🔢 Priority: ${priority}`));
  }
  if (autoSyncActive) {
    success('Task committed and pushed to remote');
  }
  console.log();
  console.log(colors.info('Next steps:'));
  console.log(colors.normal(`  1. Edit the task file to add more details`));
  console.log(colors.normal(`  2. Run ${colors.highlight(`taskin start ${taskId}`)} to begin working on it`));
  console.log();
}
