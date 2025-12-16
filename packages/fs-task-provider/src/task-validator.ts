import type {
  LintResult,
  ValidationIssue,
} from '@opentask/taskin-task-manager';
import { readFile, writeFile } from 'node:fs/promises';

/**
 * Fixes section-based metadata by converting to inline format
 */
export async function fixTaskFile(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Check if file has section-based metadata
    const hasSectionStatus = /##\s*Status\s*\n\s*([^\n\r]+)/i.test(content);
    const hasSectionType = /##\s*Type\s*\n\s*([^\n\r]+)/i.test(content);
    const hasSectionAssignee = /##\s*Assignee\s*\n\s*([^\n\r]+)/i.test(content);

    if (!hasSectionStatus && !hasSectionType && !hasSectionAssignee) {
      return false; // Nothing to fix
    }

    // Extract section-based metadata
    const statusMatch = content.match(/##\s*Status\s*\n\s*([^\n\r]+)/i);
    const typeMatch = content.match(/##\s*Type\s*\n\s*([^\n\r]+)/i);
    const assigneeMatch = content.match(/##\s*Assignee\s*\n\s*([^\n\r]+)/i);

    // Remove section-based metadata
    let newContent = content;
    if (statusMatch) {
      newContent = newContent.replace(/##\s*Status\s*\n\s*[^\n\r]+/i, '');
    }
    if (typeMatch) {
      newContent = newContent.replace(/##\s*Type\s*\n\s*[^\n\r]+/i, '');
    }
    if (assigneeMatch) {
      newContent = newContent.replace(/##\s*Assignee\s*\n\s*[^\n\r]+/i, '');
    }

    // Clean up extra blank lines
    newContent = newContent.replace(/\n{3,}/g, '\n\n');

    // Find the title line (first # heading)
    const titleLineIdx = newContent
      .split('\n')
      .findIndex((line) => line.trim().startsWith('# '));
    if (titleLineIdx === -1) {
      return false; // No title found, can't fix
    }

    const contentLines = newContent.split('\n');
    const beforeTitle = contentLines.slice(0, titleLineIdx + 1);
    const afterTitle = contentLines.slice(titleLineIdx + 1);

    // Build inline metadata to insert after title
    const inlineMetadata: string[] = [];

    if (statusMatch) {
      inlineMetadata.push(`Status: ${statusMatch[1].trim()}`);
    }

    if (typeMatch) {
      inlineMetadata.push(`Type: ${typeMatch[1].trim()}`);
    }

    if (assigneeMatch) {
      inlineMetadata.push(`Assignee: ${assigneeMatch[1].trim()}`);
    }

    // Reconstruct file
    const fixed = [...beforeTitle, ...inlineMetadata, '', ...afterTitle].join('\n');

    // Clean up extra blank lines again
    const finalContent = fixed.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    await writeFile(filePath, finalContent, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to fix ${filePath}:`, error);
    return false;
  }
}

/**
 * Validates the format and content of a task markdown file
 */
export async function validateTaskFile(
  filePath: string,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check for required sections
    const hasTitleSection = lines.some((line) => line.trim().startsWith('# '));

    // Enforce inline metadata only (no section-based '## Status')
    const hasInlineStatus = /^Status:\s*.+$/im.test(content);
    const hasSectionStatus = /##\s*Status/i.test(content);
    const hasDescriptionSection =
      content.includes('## Description') || content.includes('## Descrição');

    if (!hasTitleSection) {
      issues.push({
        file: filePath,
        line: 1,
        message: 'Task file must start with a title (# Task Title)',
        severity: 'error',
        suggestion: 'Add a level-1 heading at the start: # Your Task Title',
      });
    }

    // Reject section-based metadata: we only accept the inline format
    if (hasSectionStatus) {
      const statusLineIdx = lines.findIndex((line) =>
        /^## Status/i.test(line.trim()),
      );
      issues.push({
        file: filePath,
        line: statusLineIdx >= 0 ? statusLineIdx + 1 : undefined,
        message:
          'Section-based metadata ("## Status") is not allowed. Use inline format instead.',
        severity: 'error',
        suggestion:
          'Replace section with inline metadata:\nStatus: <todo|in-progress|done>',
      });
    }

    // Ensure inline status exists and is valid
    if (!hasInlineStatus) {
      issues.push({
        file: filePath,
        message: 'Task file must have a Status field',
        severity: 'error',
        suggestion: 'Add inline metadata after title:\nStatus: <todo|in-progress|done>',
      });
    } else {
      const statusMatch = content.match(/^Status:\s*(.+)$/im);
      const statusValue = statusMatch
        ? statusMatch[1].trim().toLowerCase()
        : '';
      if (!['todo', 'in-progress', 'done', 'pending', 'blocked', 'canceled'].includes(statusValue)) {
        const statusLineIdx = lines.findIndex(
          (line) => /^Status:/i.test(line.trim()),
        );
        issues.push({
          file: filePath,
          line: statusLineIdx >= 0 ? statusLineIdx + 1 : undefined,
          message: 'Status must be one of: todo, in-progress, done, pending, blocked, canceled',
          severity: 'error',
          suggestion: 'Set status to: todo, in-progress, done, pending, blocked, or canceled',
        });
      }
    }

    if (!hasDescriptionSection) {
      issues.push({
        file: filePath,
        message:
          'Task file should have a description section (## Description or ## Descrição)',
        severity: 'warning',
        suggestion: 'Add a description section to explain the task',
      });
    }

    // Check for proper task ID format in filename
    const fileName = filePath.split('/').pop() || '';
    if (!fileName.match(/^task-\d{3}-.*\.md$/)) {
      issues.push({
        file: filePath,
        message:
          'Task filename should follow pattern: task-NNN-description.md (e.g., task-001-my-task.md)',
        severity: 'warning',
        suggestion:
          'Rename the file to match the pattern task-001-description.md',
      });
    }

    // Check for empty sections
    const titleLine = lines.findIndex((line) => line.trim().startsWith('# '));
    if (titleLine >= 0 && lines[titleLine].trim() === '#') {
      issues.push({
        file: filePath,
        line: titleLine + 1,
        message: 'Task title cannot be empty',
        severity: 'error',
        suggestion: 'Add a meaningful title after the # symbol',
      });
    }
  } catch (error) {
    issues.push({
      file: filePath,
      message: `Failed to read or parse task file: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'error',
    });
  }

  return issues;
}

/**
 * Aggregates validation issues into a LintResult
 */
export function createLintResult(allIssues: ValidationIssue[]): LintResult {
  const errorCount = allIssues.filter(
    (issue) => issue.severity === 'error',
  ).length;
  const warningCount = allIssues.filter(
    (issue) => issue.severity === 'warning',
  ).length;
  const infoCount = allIssues.filter(
    (issue) => issue.severity === 'info',
  ).length;

  return {
    valid: errorCount === 0,
    issues: allIssues,
    errorCount,
    warningCount,
    infoCount,
  };
}
