/**
 * plan command - The scheduler's advice: for each open task, the access, the
 * model, the machine and the moment, or why it waits. Nothing is executed.
 */

import { PLAN_FORMATS, type PlanFormat, renderPlan } from '@opentask/taskin-situation';
import { openLocalPlanner } from '../lib/local-plan.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface PlanOptions {
  format?: string;
  json?: boolean;
}

export const planCommand = defineCommand({
  name: 'plan',
  description: '🗓️  Suggest an access, a model and a moment for each open task (advice only: nothing runs)',
  options: [
    {
      flags: '-f, --format <format>',
      description: 'Output format: text or json',
      defaultValue: 'text',
    },
    {
      flags: '--json',
      description: 'Shortcut for --format json',
    },
  ],
  handler: async (options: PlanOptions) => {
    await showPlan(options);
  },
});

async function showPlan(options: PlanOptions): Promise<void> {
  requireTaskinProject();

  const format = (options.json ? 'json' : (options.format ?? 'text')) as PlanFormat;
  if (!PLAN_FORMATS.includes(format)) {
    console.error(`Unknown format "${options.format}". Use one of: ${PLAN_FORMATS.join(', ')}`);
    process.exit(1);
  }

  const planner = await openLocalPlanner(process.cwd(), (warning) => console.error(`Warning: ${warning}`));
  process.stdout.write(renderPlan(await planner.plan(), format));
}
