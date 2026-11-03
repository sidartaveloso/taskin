/**
 * plan command - The scheduler's advice: for each open task, the access, the
 * model, the machine and the moment, or why it waits. Nothing is executed.
 */

import {
  buildPlanReport,
  createLocalRunLedger,
  instant,
  localPlanResources,
  PLAN_FORMATS,
  type PlanFormat,
  type PlanTaskInput,
  renderPlan,
} from '@opentask/taskin-situation';
import type { Task } from '@opentask/taskin-types';
import path from 'path';
import { probeLocalSituation } from '../lib/probe-situation.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { runLedgerFiles } from '../lib/run-ledger-files.js';
import { defineCommand } from './define-command/index.js';

interface PlanOptions {
  format?: string;
  json?: boolean;
}

const OPEN = new Set(['pending', 'in-progress', 'paused', 'in-review', 'blocked']);

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

  const root = process.cwd();
  const situation = await probeLocalSituation(root);
  const clock = { now: () => instant(Date.now()) };
  const resources = await localPlanResources({
    ...situation,
    ledger: createLocalRunLedger({ clock }, runLedgerFiles(root)),
    clock,
  });

  const { provider } = await resolveTaskProvider();
  const tasks: Task[] = await provider.getAllTasks();
  const open: PlanTaskInput[] = tasks
    .filter((t) => OPEN.has(t.status))
    .map((t) => ({
      id: String(t.id),
      title: t.title,
      ...(t.order !== undefined && { order: t.order }),
      ...(t.difficulty !== undefined && { difficulty: t.difficulty }),
      requires: t.requires ?? [],
      ...(t.description !== undefined && { description: t.description }),
    }));

  const report = await buildPlanReport({
    repository: path.basename(root),
    now: clock.now(),
    tasks: open,
    ...resources,
  });
  process.stdout.write(renderPlan(report, format));
}
