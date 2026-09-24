import type { Command } from 'commander';
import { configCommand } from './config.js';
import { dashboardCommand } from './dashboard.js';
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
import { prioritizeCommand } from './prioritize.js';
import { priorityCommand } from './priority.js';
import { reviewCommand } from './review.js';
import { startCommand } from './start.js';
import { statsCommand } from './stats.js';
import { registerUserCommand } from './user.js';

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
  statsCommand(program);
  configCommand(program);
  registerExportCommand(program);
  lintCommand(program);
  prioritizeCommand(program);
  priorityCommand(program);
  registerGroupCommand(program);
  dashboardCommand(program);
  mcpInstallCommand(program);
  mcpServerCommand(program);
  notifyCommand(program);
  registerUserCommand(program);
}
