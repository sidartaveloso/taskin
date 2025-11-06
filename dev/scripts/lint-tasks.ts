#!/usr/bin/env tsx
/**
 * Task Markdown Linter
 * Validates that all task files in TASKS/ follow the correct format
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { exit } from 'process';

interface ValidationError {
  file: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning';
}

interface TaskMetadata {
  status?: string;
  type?: string;
  assignee?: string;
}

const VALID_STATUSES = ['pending', 'in-progress', 'done', 'blocked'];
const VALID_TYPES = ['feat', 'fix', 'chore', 'docs', 'refactor', 'test'];

const errors: ValidationError[] = [];

function addError(
  file: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
  line?: number,
) {
  errors.push({ file, message, severity, line });
}

function validateTaskFilename(filename: string): boolean {
  // Format: task-NNN-kebab-case-title.md
  const pattern = /^task-\d{2,3}-[a-z0-9-]+\.md$/;
  return pattern.test(filename);
}

function extractMetadata(content: string): TaskMetadata | null {
  // Get content before first ## heading
  const headerSection = content.split(/^##/m)[0];

  const statusMatch = headerSection.match(/^Status:\s*(.+)$/im);
  const typeMatch = headerSection.match(/^Type:\s*(.+)$/im);
  const assigneeMatch = headerSection.match(/^Assignee:\s*(.+)$/im);

  return {
    status: statusMatch?.[1]?.trim().toLowerCase(),
    type: typeMatch?.[1]?.trim().toLowerCase(),
    assignee: assigneeMatch?.[1]?.trim(),
  };
}

function validateTaskContent(filename: string, content: string): void {
  const lines = content.split('\n');

  // 1. Check if file starts with H1 heading
  if (!lines[0]?.trim().startsWith('# ')) {
    addError(
      filename,
      'Task file must start with a level 1 heading (# Task NNN — Title)',
      'error',
      1,
    );
  }

  // 2. Validate H1 format: # Task NNN — Title or # 🧩 Task NNN — Title
  const h1Pattern = /^#\s+(?:🧩\s+)?Task\s+\d{2,3}\s+[—-]\s+.+$/i;
  if (lines[0] && !h1Pattern.test(lines[0])) {
    addError(
      filename,
      'H1 heading must follow format: "# Task NNN — Title" or "# 🧩 Task NNN — Title"',
      'error',
      1,
    );
  }

  // 3. Extract and validate metadata
  const metadata = extractMetadata(content);

  if (!metadata) {
    addError(filename, 'Unable to parse task metadata', 'error');
    return;
  }

  if (!metadata.status) {
    addError(
      filename,
      'Missing required metadata: Status (must be in header section before first ##)',
      'error',
    );
  } else if (!VALID_STATUSES.includes(metadata.status)) {
    addError(
      filename,
      `Invalid status "${metadata.status}". Valid statuses: ${VALID_STATUSES.join(', ')}`,
      'error',
    );
  }

  if (!metadata.type) {
    addError(
      filename,
      'Missing required metadata: Type (must be in header section before first ##)',
      'error',
    );
  } else if (!VALID_TYPES.includes(metadata.type)) {
    addError(
      filename,
      `Invalid type "${metadata.type}". Valid types: ${VALID_TYPES.join(', ')}`,
      'error',
    );
  }

  if (!metadata.assignee) {
    addError(filename, 'Missing recommended metadata: Assignee', 'warning');
  }

  // 4. Check for at least one H2 section
  const h2Sections = content.match(/^##\s+.+$/gm);
  if (!h2Sections || h2Sections.length === 0) {
    addError(
      filename,
      'Task should have at least one section (## heading)',
      'warning',
    );
  }

  // 5. Validate metadata is in header (before first ##)
  const firstH2Index = content.indexOf('\n##');
  if (firstH2Index > -1) {
    const afterH2 = content.substring(firstH2Index);
    if (
      afterH2.match(/^Status:/im) ||
      afterH2.match(/^Type:/im) ||
      afterH2.match(/^Assignee:/im)
    ) {
      addError(
        filename,
        'Metadata (Status, Type, Assignee) must be placed BEFORE the first ## section',
        'error',
      );
    }
  }
}

async function lintTasksDirectory(tasksDir: string): Promise<void> {
  try {
    const files = await readdir(tasksDir);
    const taskFiles = files.filter((f) => f.endsWith('.md'));

    if (taskFiles.length === 0) {
      console.log('⚠️  No task files found in TASKS/');
      return;
    }

    console.log(`📋 Linting ${taskFiles.length} task file(s)...\n`);

    for (const file of taskFiles) {
      // Validate filename
      if (!validateTaskFilename(file)) {
        addError(
          file,
          'Invalid filename format. Expected: task-NNN-kebab-case-title.md',
          'error',
        );
      }

      // Validate content
      const filePath = join(tasksDir, file);
      const content = await readFile(filePath, 'utf-8');
      validateTaskContent(file, content);
    }
  } catch (error) {
    console.error('❌ Error reading TASKS directory:', error);
    exit(1);
  }
}

function printResults(): void {
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  if (errors.length === 0) {
    console.log('✅ All task files are valid!\n');
    return;
  }

  console.log('📊 Validation Results:\n');

  // Group errors by file
  const errorsByFile = new Map<string, ValidationError[]>();
  for (const error of errors) {
    if (!errorsByFile.has(error.file)) {
      errorsByFile.set(error.file, []);
    }
    errorsByFile.get(error.file)!.push(error);
  }

  // Print errors grouped by file
  for (const [file, fileErrors] of errorsByFile) {
    console.log(`\n📄 ${file}`);
    for (const error of fileErrors) {
      const icon = error.severity === 'error' ? '❌' : '⚠️';
      const location = error.line ? `:${error.line}` : '';
      console.log(`  ${icon} ${error.message}${location}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(
    `\n📊 Summary: ${errorCount} error(s), ${warningCount} warning(s)\n`,
  );

  if (errorCount > 0) {
    exit(1);
  }
}

// Main execution
const tasksDir = join(process.cwd(), 'TASKS');

lintTasksDirectory(tasksDir)
  .then(() => printResults())
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    exit(1);
  });
