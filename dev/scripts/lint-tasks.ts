#!/usr/bin/env tsx
/**
 * Task Markdown Linter
 * Validates that all task files in TASKS/ follow the correct format
 * Now uses the TaskManager.lint() method from the provider architecture
 *
 * Usage:
 *   pnpm lint:tasks        - Validate tasks
 *   pnpm lint:tasks --fix  - Validate and auto-fix issues
 */

import { FileSystemTaskProvider } from '@opentask/taskin-fs-provider';
import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { TaskManager } from '@opentask/taskin-task-manager';
import { join } from 'path';
import { exit } from 'process';

function printResults(
  issues: ValidationIssue[],
  errorCount: number,
  warningCount: number,
  infoCount: number,
): void {
  if (issues.length === 0) {
    console.log('✅ All task files are valid!\n');
    return;
  }

  console.log('📊 Validation Results:\n');

  // Group issues by file
  const issuesByFile = new Map<string, ValidationIssue[]>();
  for (const issue of issues) {
    if (!issuesByFile.has(issue.file)) {
      issuesByFile.set(issue.file, []);
    }
    issuesByFile.get(issue.file)!.push(issue);
  }

  // Print issues grouped by file
  for (const [file, fileIssues] of issuesByFile) {
    // Extract just the filename from full path
    const filename = file.split('/').pop() || file;
    console.log(`\n📄 ${filename}`);

    for (const issue of fileIssues) {
      const icon =
        issue.severity === 'error'
          ? '❌'
          : issue.severity === 'warning'
            ? '⚠️'
            : 'ℹ️';
      const location = issue.line ? ` (line ${issue.line})` : '';
      console.log(`  ${icon} ${issue.message}${location}`);

      if (issue.suggestion) {
        console.log(`     💡 ${issue.suggestion}`);
      }
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(
    `\n📊 Summary: ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info\n`,
  );

  if (errorCount > 0) {
    exit(1);
  }
}

async function main(): Promise<void> {
  try {
    // Check for --fix flag
    const shouldFix = process.argv.includes('--fix');

    // Find the monorepo root (parent of dev/)
    const monorepoRoot = join(process.cwd(), '..');
    const tasksDir = join(monorepoRoot, 'TASKS');

    if (shouldFix) {
      console.log(`📋 Linting and fixing task files in ${tasksDir}...\n`);
    } else {
      console.log(`📋 Linting task files in ${tasksDir}...\n`);
    }

    // Create a simple user registry (empty for linting purposes)
    const userRegistry = {
      resolveUser: () => undefined,
      createTemporaryUser: (name: string) => ({ id: 'temp', name, email: '' }),
    };

    // Create provider and manager
    const provider = new FileSystemTaskProvider(tasksDir, userRegistry);
    const taskManager = new TaskManager(provider);

    // Run lint with optional fix
    const result = await taskManager.lint(shouldFix);

    // Print results
    printResults(
      result.issues,
      result.errorCount,
      result.warningCount,
      result.infoCount,
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    exit(1);
  }
}

main();
