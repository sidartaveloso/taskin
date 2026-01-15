/**
 * stats command - Show user and team metrics/statistics
 */

import {
  FileSystemMetricsAdapter,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import { GitAnalyzer } from '@opentask/taskin-git-utils';
import type { StatsQuery, TeamStats, UserStats } from '@opentask/taskin-types';
import path from 'path';
import { colors, printHeader } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { defineCommand } from './define-command/index.js';

interface StatsOptions {
  user?: string;
  period?: 'day' | 'week' | 'month' | 'year';
  task?: string;
  detailed?: boolean;
  team?: boolean;
}

export const statsCommand = defineCommand({
  name: 'stats',
  description: '📊 Show user/team metrics and statistics',
  options: [
    {
      flags: '-u, --user <username>',
      description: 'Show stats for specific user',
    },
    {
      flags: '-p, --period <period>',
      description: 'Time period (day, week, month, year)',
    },
    {
      flags: '-t, --task <taskId>',
      description: 'Show stats for specific task',
    },
    {
      flags: '-d, --detailed',
      description: 'Show detailed metrics',
    },
    {
      flags: '--team',
      description: 'Show team metrics instead of user metrics',
    },
  ],
  handler: async (options: StatsOptions) => {
    await showStats(options);
  },
});

async function showStats(options: StatsOptions): Promise<void> {
  requireTaskinProject();

  const configPath = path.join(process.cwd(), '.taskin', 'config.json');
  const tasksDir = path.join(process.cwd(), 'TASKS');

  // Initialize services
  const userRegistry = new UserRegistry(configPath);
  const gitAnalyzer = new GitAnalyzer(process.cwd());
  const metricsAdapter = new FileSystemMetricsAdapter(
    tasksDir,
    userRegistry,
    gitAnalyzer,
  );

  const query: StatsQuery = {
    period: options.period || 'week',
  };

  try {
    if (options.team) {
      printHeader('Team Statistics', '👥');
      const stats = await metricsAdapter.getTeamMetrics('default', query);
      displayTeamStats(stats, options.detailed);
    } else if (options.task) {
      printHeader(`Task Statistics: ${options.task}`, '📋');
      const stats = await metricsAdapter.getTaskMetrics(options.task, query);
      displayTaskStats(stats, options.detailed);
    } else {
      const username =
        options.user || userRegistry.getCurrentUser()?.name || 'unknown';
      printHeader(`User Statistics: ${username}`, '👤');
      const stats = await metricsAdapter.getUserMetrics(username, query);
      displayUserStats(stats, options.detailed);
    }
  } catch (error) {
    console.error(colors.red('\n❌ Error fetching stats:'), error);
    process.exit(1);
  }
}

function displayUserStats(stats: UserStats, detailed = false): void {
  console.log(
    `${colors.dim('Period:')} ${stats.period} (${formatDate(stats.periodStart)} to ${formatDate(stats.periodEnd)})\n`,
  );

  // Code Metrics
  console.log(colors.bold('📝 Code Metrics'));
  console.log(
    `  ${colors.green('+')}${stats.codeMetrics.linesAdded} lines added`,
  );
  console.log(
    `  ${colors.red('-')}${stats.codeMetrics.linesRemoved} lines removed`,
  );
  console.log(`  ${colors.cyan('=')}${stats.codeMetrics.netChange} net change`);
  console.log(`  📁 ${stats.codeMetrics.filesChanged} files changed`);
  console.log(`  💾 ${stats.codeMetrics.commits} commits\n`);

  // Contribution Metrics
  console.log(colors.bold('🎯 Contribution'));
  console.log(
    `  ✅ ${stats.contributionMetrics.tasksCompleted} tasks completed`,
  );
  console.log(
    `  📊 ${stats.contributionMetrics.activityFrequency.toFixed(2)} commits/day\n`,
  );

  // Engagement
  console.log(colors.bold('⚡ Engagement'));
  console.log(
    `  🔥 ${(stats.engagementMetrics.completionRate * 100).toFixed(1)}% completion rate`,
  );
  console.log(
    `  📈 ${stats.engagementMetrics.activeTasksCount} active tasks\n`,
  );

  if (detailed) {
    // Temporal Metrics
    console.log(colors.bold('⏰ Temporal Patterns'));
    console.log('  By Day of Week:');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    Object.entries(stats.temporalMetrics.byDayOfWeek).forEach(
      ([day, count]) => {
        const dayName = days[parseInt(day)];
        const bar = createBar(
          count,
          Math.max(...Object.values(stats.temporalMetrics.byDayOfWeek)),
        );
        console.log(`    ${dayName}: ${bar} ${count}`);
      },
    );

    console.log('\n  By Time of Day:');
    Object.entries(stats.temporalMetrics.byTimeOfDay).forEach(
      ([time, count]) => {
        const maxTime = Math.max(
          ...Object.values(stats.temporalMetrics.byTimeOfDay),
        );
        const bar = createBar(count, maxTime);
        console.log(`    ${time.padEnd(10)}: ${bar} ${count}`);
      },
    );

    console.log(`\n  🔥 Streak: ${stats.temporalMetrics.streak} days`);
    console.log(
      `  📈 Trend: ${getTrendEmoji(stats.temporalMetrics.trend)} ${stats.temporalMetrics.trend}\n`,
    );
  }
}

function displayTeamStats(stats: TeamStats, detailed = false): void {
  console.log(
    `${colors.dim('Period:')} ${stats.period} (${formatDate(stats.periodStart)} to ${formatDate(stats.periodEnd)})\n`,
  );

  console.log(colors.bold('👥 Team Overview'));
  console.log(`  👤 ${stats.totalContributors} contributors`);
  console.log(`  💾 ${stats.totalCommits} total commits`);
  console.log(`  ✅ ${stats.totalTasksCompleted} tasks completed\n`);

  console.log(colors.bold('📝 Code Metrics'));
  console.log(
    `  ${colors.green('+')}${stats.codeMetrics.linesAdded} lines added`,
  );
  console.log(
    `  ${colors.red('-')}${stats.codeMetrics.linesRemoved} lines removed`,
  );
  console.log(`  📁 ${stats.codeMetrics.filesChanged} files changed\n`);

  if (detailed && stats.contributors.length > 0) {
    console.log(colors.bold('🏆 Top Contributors'));
    stats.contributors
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 5)
      .forEach((contrib, idx) => {
        console.log(
          `  ${idx + 1}. ${contrib.username}: ${contrib.commits} commits, ${contrib.tasksCompleted} tasks`,
        );
      });
  }
}

function displayTaskStats(stats: any, detailed = false): void {
  console.log(`${colors.dim('Task:')} ${stats.taskId} - ${stats.title}\n`);

  console.log(colors.bold('📋 Task Info'));
  console.log(`  Status: ${getStatusEmoji(stats.status)} ${stats.status}`);
  console.log(`  Type: ${stats.type}`);
  console.log(`  Assignee: ${stats.assignee || 'unassigned'}\n`);

  console.log(colors.bold('📝 Code Metrics'));
  console.log(
    `  ${colors.green('+')}${stats.codeMetrics.linesAdded} lines added`,
  );
  console.log(
    `  ${colors.red('-')}${stats.codeMetrics.linesRemoved} lines removed`,
  );
  console.log(`  📁 ${stats.codeMetrics.filesChanged} files changed\n`);

  if (stats.contributors.length > 0) {
    console.log(colors.bold('👥 Contributors'));
    stats.contributors.forEach((c: string) => {
      console.log(`  • ${c}`);
    });
  }
}

// Helper functions
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString();
}

function createBar(value: number, max: number, length = 20): string {
  if (max === 0) return '░'.repeat(length);
  const filled = Math.round((value / max) * length);
  return (
    colors.cyan('█'.repeat(filled)) + colors.dim('░'.repeat(length - filled))
  );
}

function getTrendEmoji(trend: string): string {
  switch (trend) {
    case 'increasing':
      return '📈';
    case 'decreasing':
      return '📉';
    default:
      return '➡️';
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'done':
      return '✅';
    case 'in-progress':
      return '🔄';
    case 'blocked':
      return '🚫';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}
