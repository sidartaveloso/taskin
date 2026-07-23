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
      name: colors.highlight('taskin init'),
      alias: colors.secondary('Alias: setup'),
      description: 'Initialize Taskin in your project',
      examples: ['taskin init', 'taskin setup'],
      icon: '🎯',
    },
    {
      name: colors.highlight('taskin list') + colors.normal(' [filter]'),
      alias: colors.secondary('Alias: ls'),
      description: 'List all tasks in the project',
      examples: ['taskin list', 'taskin list pending', 'taskin list --status in-progress', 'taskin list --type feat'],
      icon: '📊',
    },
    {
      name: colors.highlight('taskin new'),
      alias: colors.secondary('Alias: create'),
      description: 'Create a new task',
      examples: [
        'taskin new -t feat -T "Add login" -d "Implement user authentication"',
        'taskin new --type fix --title "Fix bug" --user "John"',
        'taskin create -t docs -T "Update README"',
      ],
      icon: '📝',
    },
    {
      name: colors.highlight('taskin start') + colors.normal(' <task-id>'),
      alias: colors.secondary('Alias: begin'),
      description: 'Start working on a task (suggests commits)',
      examples: ['taskin start 001', 'taskin start task-001', 'taskin start 001 --force'],
      icon: '🚀',
    },
    {
      name: colors.highlight('taskin pause') + colors.normal(' <task-id>'),
      alias: colors.secondary('Alias: stop'),
      description: 'Pause a task (auto-commits work in progress)',
      examples: ['taskin pause 001', 'taskin pause 001 -m "saving progress"'],
      icon: '⏸️',
    },
    {
      name: colors.highlight('taskin finish') + colors.normal(' <task-id>'),
      alias: colors.secondary('Alias: done'),
      description: 'Finish a task (suggests commits)',
      examples: ['taskin finish 001', 'taskin done task-001'],
      icon: '✅',
    },
    {
      name: colors.highlight('taskin config') + colors.normal(' [options]'),
      alias: colors.secondary('Options: --level <manual|assisted|autopilot>'),
      description: 'Configure automation level',
      examples: ['taskin config', 'taskin config --level assisted', 'taskin config --level autopilot'],
      icon: '⚙️',
    },
    {
      name: colors.highlight('taskin lint') + colors.normal(' [options]'),
      alias: colors.secondary('Options: -p, --path <directory>'),
      description: 'Validate task markdown files',
      examples: ['taskin lint', 'taskin lint --path ./TASKS', 'taskin lint -p /path/to/tasks'],
      icon: '🔍',
    },
    {
      name: colors.highlight('taskin dashboard') + colors.normal(' [options]'),
      alias: colors.secondary('Options: --host, --port, --filter-open, --filter-closed'),
      description: 'Start the web dashboard',
      examples: [
        'taskin dashboard',
        'taskin dashboard --port 3000',
        'taskin dashboard --filter-open',
        'taskin dashboard --filter-closed -o',
      ],
      icon: '📊',
    },
    {
      name: colors.highlight('taskin mcp-server'),
      alias: colors.secondary('Alias: mcp'),
      description: 'Start MCP server for Claude Desktop integration',
      examples: ['taskin mcp-server', 'taskin mcp'],
      icon: '🤖',
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
    colors.normal(`${colors.warning('•')} Use short IDs: ${colors.highlight('001')}, ${colors.highlight('task-001')}`),
  );
  console.log(
    colors.normal(
      `${colors.warning('•')} Configure automation with ${colors.highlight('taskin config --level <manual|assisted|autopilot>')}`,
    ),
  );
  console.log(
    colors.normal(`${colors.warning('•')} All commands support ${colors.highlight('--help')} for more options`),
  );
  console.log(
    colors.normal(
      `${colors.warning('•')} Use aliases for faster commands: ${colors.highlight('ls')}, ${colors.highlight('begin')}, ${colors.highlight('stop')}, ${colors.highlight('done')}`,
    ),
  );
  console.log();

  console.log(colors.info('🔧 FOR MORE HELP'));
  console.log(colors.secondary('taskin ') + colors.highlight('<command>') + colors.secondary(' --help'));
  console.log();

  return '';
}
