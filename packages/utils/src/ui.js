import chalk from 'chalk';
export const colors = {
  error: chalk.red,
  highlight: chalk.magenta,
  info: chalk.cyan,
  normal: chalk.white,
  primary: chalk.blue,
  secondary: chalk.gray,
  success: chalk.green,
  warning: chalk.yellow,
};
export const icons = {
  assignee: '👤',
  branch: '🌿',
  commit: '💾',
  blocked: '⛔',
  error: '❌',
  hourglass: '⏳',
  info: 'ℹ️',
  play: '▶️',
  rocket: '🚀',
  status: '📊',
  success: '✅',
  task: '📝',
  warning: '⚠️',
};
export function printHeader(title, icon = '') {
  const header = `${icon} ${title} ${icon}`;
  console.log(colors.primary('='.repeat(header.length + 4)));
  console.log(colors.primary(`  ${header}  `));
  console.log(colors.primary('='.repeat(header.length + 4)));
  console.log();
}
//# sourceMappingURL=ui.js.map
