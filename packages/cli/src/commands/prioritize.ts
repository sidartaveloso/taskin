/**
 * `taskin prioritize` — numeracao inicial de prioridade, num ato deliberado.
 */

import { TaskManager } from '@opentask/taskin-task-manager';
import { colors, error, info, printHeader, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';

interface PrioritizeOptions {
  dryRun?: boolean;
}

export const prioritizeCommand = defineCommand({
  name: 'prioritize',
  description: '🔢 Give every task a priority number, once and on purpose',
  options: [
    {
      flags: '--dry-run',
      description: 'Show how many tasks would be numbered, without writing',
    },
  ],
  handler: async (options: PrioritizeOptions) => {
    await prioritize(options);
  },
});

async function prioritize(options: PrioritizeOptions): Promise<void> {
  requireTaskinProject();
  printHeader('Prioritize', '🔢');

  const { provider } = await resolveTaskProvider();
  const manager = new TaskManager(provider);

  const previa = await manager.prioritizeAll({ dryRun: true });

  if (previa.changed === 0) {
    success('Every task already carries a priority. Nothing to do.');
    return;
  }

  info(`${previa.total} task(s) in the project, ${previa.withoutPriority} without a priority.`);

  if (options.dryRun) {
    info(`${previa.changed} task(s) would be numbered. Nothing was written.`);
    console.log(colors.secondary('  Run without --dry-run to apply.'));
    return;
  }

  const feito = await manager.prioritizeAll();
  success(`Numbered ${feito.changed} task(s).`);
  info('From here, moving a task in the dashboard rewrites a single file.');
}
