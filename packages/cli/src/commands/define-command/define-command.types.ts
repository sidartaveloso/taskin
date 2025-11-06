/**
 * Command definition types
 */

import type { Command } from 'commander';

export interface CommandOption {
  description: string;
  flags: string;
  defaultValue?: string | boolean | string[];
}

export interface CommandConfig {
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (...args: any[]) => Promise<void> | void;
  name: string;
  alias?: string;
  options?: CommandOption[];
}

/**
 * Type for a command registration function
 * Takes a Commander program and registers a command with it
 */
export type CommandRegistration = (program: Command) => void;

/**
 * Type for the defineCommand function.
 *
 * Define a CLI command with declarative configuration.
 * This function takes a command configuration object and returns a function
 * that registers the command with a Commander program.
 *
 * @param config - Command configuration object containing name, description, options, and handler
 * @returns Function that registers the command with a Commander program
 *
 * @example
 * ```typescript
 * export const listCommand = defineCommand({
 *   name: 'list [filter]',
 *   description: '📊 List all tasks',
 *   alias: 'ls',
 *   options: [
 *     { flags: '-s, --status <status>', description: 'Filter by status' }
 *   ],
 *   handler: async (filter, options) => {
 *     // Implementation
 *   }
 * });
 * ```
 */
export type DefineCommandFunction = (
  config: CommandConfig,
) => CommandRegistration;
