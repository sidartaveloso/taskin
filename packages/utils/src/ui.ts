import chalk from 'chalk';

export const colors = {
  primary: chalk.blue,
  secondary: chalk.gray,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.cyan,
  highlight: chalk.magenta,
  normal: chalk.white,
};

export const icons = {
  rocket: '🚀',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
  error: '❌',
  task: '📝',
  branch: '🌿',
  commit: '💾',
  assignee: '👤',
  status: '📊',
  play: '▶️',
  blocked: '⛔',
  hourglass: '⏳',
};

export function printHeader(title: string, icon: string = '') {
  const header = `${icon} ${title} ${icon}`;
  console.log(colors.primary('='.repeat(header.length + 4)));
  console.log(colors.primary(`  ${header}  `));
  console.log(colors.primary('='.repeat(header.length + 4)));
  console.log();
}
