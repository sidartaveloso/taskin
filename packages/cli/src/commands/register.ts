import type { Command } from 'commander';
import { registerAccessCommand } from './access.js';
import { configCommand } from './config.js';
import { registerDaemonCommand } from './daemon.js';
import { dashboardCommand } from './dashboard.js';
import { difficultyCommand } from './difficulty.js';
import { estimateCommand } from './estimate.js';
import { registerExportCommand } from './export.js';
import { finishCommand } from './finish.js';
import { registerGroupCommand } from './group.js';
import { initCommand } from './init.js';
import { lintCommand } from './lint.js';
import { listCommand } from './list.js';
import { mcpInstallCommand } from './mcp-install.js';
import { mcpServerCommand } from './mcp-server.js';
import { createCommand } from './new.js';
import { notifyCommand } from './notify.js';
import { pauseCommand } from './pause.js';
import { planCommand } from './plan.js';
import { prioritizeCommand } from './prioritize.js';
import { priorityCommand } from './priority.js';
import { reviewCommand } from './review.js';
import { registerRunCommand } from './run.js';
import { startCommand } from './start.js';
import { statsCommand } from './stats.js';
import { statusCommand } from './status.js';
import { registerUserCommand } from './user.js';
import { registerViewpointsCommand } from './viewpoints.js';

/**
 * Registra todos os comandos no programa.
 *
 * Separado do `index.ts`, que faz `parse()` ao ser importado, para um teste
 * poder montar o programa inteiro e conferir que cada comando declarado em
 * `SUPERFICIES_DAS_OPERACOES` existe de verdade.
 */
export function registerCommands(program: Command): void {
  initCommand(program);
  listCommand(program);
  createCommand(program);
  startCommand(program);
  pauseCommand(program);
  reviewCommand(program);
  finishCommand(program);
  statusCommand(program);
  planCommand(program);
  statsCommand(program);
  configCommand(program);
  registerExportCommand(program);
  lintCommand(program);
  prioritizeCommand(program);
  priorityCommand(program);
  difficultyCommand(program);
  estimateCommand(program);
  registerGroupCommand(program);
  dashboardCommand(program);
  mcpInstallCommand(program);
  mcpServerCommand(program);
  registerDaemonCommand(program);
  notifyCommand(program);
  registerUserCommand(program);
  registerAccessCommand(program);
  registerRunCommand(program);
  registerViewpointsCommand(program);
}
