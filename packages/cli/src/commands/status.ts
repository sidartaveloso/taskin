/**
 * status command - The situation board: the task in progress, the resources,
 * the accesses and which open tasks run on this machine
 */

import {
  buildStatusReport,
  renderStatus,
  STATUS_FORMATS,
  type StatusFormat,
  type StatusTaskInput,
} from '@opentask/taskin-situation';
import type { Task } from '@opentask/taskin-types';
import path from 'path';
import { probeSituation } from '../lib/probe-situation.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';

interface StatusOptions {
  format?: string;
  json?: boolean;
}

const OPEN = new Set(['pending', 'in-progress', 'paused', 'in-review', 'blocked']);

export const statusCommand = defineCommand({
  name: 'status',
  description: '🧭 Show the situation board: what is in progress, the resources and where each open task runs',
  options: [
    {
      flags: '-f, --format <format>',
      description: 'Output format: text, json, html or md',
      defaultValue: 'text',
    },
    {
      flags: '--json',
      description: 'Shortcut for --format json',
    },
  ],
  handler: async (options: StatusOptions) => {
    await showStatus(options);
  },
});

async function showStatus(options: StatusOptions): Promise<void> {
  requireTaskinProject();

  const format = (options.json ? 'json' : (options.format ?? 'text')) as StatusFormat;
  if (!STATUS_FORMATS.includes(format)) {
    console.error(`Unknown format "${options.format}". Use one of: ${STATUS_FORMATS.join(', ')}`);
    process.exit(1);
  }

  const repository = path.basename(process.cwd());
  const withThisMachine = await probeSituation(process.cwd());

  const { provider } = await resolveTaskProvider();
  const tasks: Task[] = await provider.getAllTasks();
  const open = tasks.filter((t) => OPEN.has(t.status));
  const current = open.find((t) => t.status === 'in-progress');
  const openTasks: StatusTaskInput[] = open.map((t) => ({
    id: String(t.id),
    title: t.title,
    requires: t.requires ?? [],
  }));

  const report = buildStatusReport({
    repository,
    view: withThisMachine,
    current: current ? { id: String(current.id), title: current.title } : null,
    openTasks,
  });

  process.stdout.write(renderStatus(report, format));
}
