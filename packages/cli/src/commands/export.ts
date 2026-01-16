import {
  FileSystemMetricsAdapter,
  UserRegistry,
} from '@opentask/taskin-file-system-provider';
import { GitAnalyzer } from '@opentask/taskin-git-utils';
import type { UserStats } from '@opentask/taskin-types';
import type { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

/**
 * Converts UserStats to CSV format
 */
function userStatsToCsv(stats: UserStats): string {
  const headers = [
    'username',
    'period',
    'period_start',
    'period_end',
    'commits',
    'lines_added',
    'lines_removed',
    'net_change',
    'files_changed',
    'tasks_completed',
    'completion_rate',
    'commits_per_day',
    'streak',
    'trend',
  ].join(',');

  const values = [
    stats.username,
    stats.period,
    stats.periodStart,
    stats.periodEnd,
    stats.codeMetrics.commits,
    stats.codeMetrics.linesAdded,
    stats.codeMetrics.linesRemoved,
    stats.codeMetrics.netChange,
    stats.codeMetrics.filesChanged,
    stats.contributionMetrics.tasksCompleted,
    stats.engagementMetrics.completionRate.toFixed(2),
    stats.engagementMetrics.commitsPerDay.toFixed(2),
    stats.temporalMetrics.streak,
    stats.temporalMetrics.trend,
  ].join(',');

  return `${headers}\n${values}`;
}

/**
 * Export stats command
 */
export function registerExportCommand(program: Command) {
  program
    .command('export')
    .description('Export metrics to CSV or JSON')
    .option('-u, --user <username>', 'User to export metrics for')
    .option('-f, --format <format>', 'Output format (csv|json)', 'json')
    .option('-o, --output <file>', 'Output file path')
    .option('-p, --period <period>', 'Time period (day|week|month)', 'week')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const tasksDir = path.join(cwd, 'TASKS');

        // Check if TASKS directory exists
        try {
          await fs.access(tasksDir);
        } catch {
          console.error('❌ TASKS directory not found in current directory');
          process.exit(1);
        }

        // Initialize services
        const gitAnalyzer = new GitAnalyzer(cwd);
        const userRegistry = new UserRegistry({
          taskinDir: path.join(cwd, '.taskin'),
        });
        await userRegistry.load();

        const metricsAdapter = new FileSystemMetricsAdapter(
          tasksDir,
          userRegistry,
          gitAnalyzer,
        );

        // Get user metrics
        const username = options.user || process.env.USER || 'unknown';
        const stats = await metricsAdapter.getUserMetrics(username, {
          period: options.period,
        });

        // Format output
        let output: string;
        if (options.format === 'csv') {
          output = userStatsToCsv(stats);
        } else {
          output = JSON.stringify(stats, null, 2);
        }

        // Write to file or stdout
        if (options.output) {
          await fs.writeFile(options.output, output, 'utf-8');
          console.log(`✅ Metrics exported to ${options.output}`);
        } else {
          console.log(output);
        }
      } catch (error) {
        console.error('❌ Error exporting metrics:', error);
        process.exit(1);
      }
    });
}
