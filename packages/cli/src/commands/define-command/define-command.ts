/**
 * Command definition helper
 * Provides a declarative way to define CLI commands
 */

import type { Command } from 'commander';
import { error } from '../../lib/colors.js';
import type { DefineCommandFunction } from './define-command.types.js';

export const defineCommand: DefineCommandFunction = (config) => {
  return (program: Command) => {
    const cmd = program.command(config.name).description(config.description);

    if (config.alias) {
      cmd.alias(config.alias);
    }

    config.options?.forEach((opt) => {
      cmd.option(opt.flags, opt.description, opt.defaultValue);
    });

    cmd.action(async (...args) => {
      try {
        await config.handler(...args);
      } catch (err) {
        error(
          `Failed to execute command: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
  };
};
