/**
 * Custom help display for the CLI
 */

import { colors, icons, printHeader } from './colors.js';

export function showCustomHelp(): string {
  printHeader('Taskin - Task Management System', icons.rocket);

  console.log(colors.info('📋 AVAILABLE COMMANDS'));
  console.log(colors.highlight('═'.repeat(60)));
  console.log();

  const commands = [
    {
      name: colors.highlight('taskin list') + colors.normal(' [filter]'),
      alias: colors.secondary('Alias: ls'),
      description: 'List all tasks in the project',
      examples: [
        'taskin list',
        'taskin list pending',
        'taskin list --status in-progress',
        'taskin list --type feat',
      ],
      icon: '📊',
    },
    {
      name: colors.highlight('taskin start') + colors.normal(' <task-id>'),
      alias: colors.secondary('Alias: begin'),
      description: 'Start working on a task',
      examples: [
        'taskin start 001',
        'taskin start task-001',
        'taskin start 001 --force',
      ],
      icon: '🚀',
    },
    {
      name: colors.highlight('taskin pause') + colors.normal(' <task-id>'),
      alias: colors.secondary('Alias: stop'),
      description: 'Pause a task (commit without push)',
      examples: ['taskin pause 001', 'taskin pause 001 -m "saving progress"'],
      icon: '⏸️',
    },
    {
      name: colors.highlight('taskin finish') + colors.normal(' <task-id>'),
      alias: colors.secondary('Alias: done'),
      description: 'Finish a task',
      examples: ['taskin finish 001', 'taskin done task-001'],
      icon: '✅',
    },
    {
      name: colors.highlight('taskin lint') + colors.normal(' [options]'),
      alias: colors.secondary('Options: -p, --path <directory>'),
      description: 'Validate task markdown files',
      examples: [
        'taskin lint',
        'taskin lint --path ./TASKS',
        'taskin lint -p /path/to/tasks',
      ],
      icon: '🔍',
    },
  ];

  commands.forEach((cmd, index) => {
    console.log(colors.warning(`${cmd.icon} ${cmd.name}`));
    console.log(colors.normal(`   ${cmd.alias}`));
    console.log(colors.info(`   ${cmd.description}`));
    console.log();

    console.log(colors.normal(`   ${colors.info('📝 Examples:')}`));
    cmd.examples.forEach((example) => {
      console.log(colors.secondary(`      ${example}`));
    });

    if (index < commands.length - 1) {
      console.log();
      console.log(colors.normal('   ' + colors.secondary('─'.repeat(50))));
      console.log();
    }
  });

  console.log();
  console.log(colors.highlight('═'.repeat(60)));
  console.log();

  console.log(colors.info('💡 QUICK TIPS'));
  console.log(
    colors.normal(
      `${colors.warning('•')} Use short IDs: ${colors.highlight('001')}, ${colors.highlight('task-001')}`,
    ),
  );
  console.log(
    colors.normal(
      `${colors.warning('•')} All commands support ${colors.highlight('--help')} for more options`,
    ),
  );
  console.log(
    colors.normal(
      `${colors.warning('•')} Use aliases for faster commands: ${colors.highlight('ls')}, ${colors.highlight('begin')}, ${colors.highlight('stop')}, ${colors.highlight('done')}`,
    ),
  );
  console.log();

  console.log(colors.info('🔧 FOR MORE HELP'));
  console.log(
    colors.secondary('taskin ') +
      colors.highlight('<command>') +
      colors.secondary(' --help'),
  );
  console.log();

  return '';
}
