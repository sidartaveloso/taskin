/**
 * Color utilities for CLI output
 */

import chalk from 'chalk';

export const colors = {
  info: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  highlight: chalk.bold.white,
  secondary: chalk.gray,
  normal: chalk.white,
};

export const icons = {
  rocket: '🚀',
  list: '📊',
  check: '✅',
  pause: '⏸️',
  info: '💡',
  task: '📋',
  gear: '⚙️',
};

export function printHeader(title: string, icon: string): void {
  console.log();
  console.log(colors.highlight('═'.repeat(60)));
  console.log(colors.highlight(`${icon}  ${title}`));
  console.log(colors.highlight('═'.repeat(60)));
  console.log();
}

export function success(message: string): void {
  console.log(colors.success(`✓ ${message}`));
}

export function error(message: string): void {
  console.error(colors.error(`✗ ${message}`));
}

export function info(message: string): void {
  console.log(colors.info(`ℹ ${message}`));
}

export function warning(message: string): void {
  console.log(colors.warning(`⚠ ${message}`));
}
