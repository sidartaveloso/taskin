import type {
  LintResult,
  ValidationIssue,
} from '@opentask/taskin-task-manager';
import { readFile, writeFile } from 'node:fs/promises';
import { detectLocale, getI18n } from './i18n.js';

/**
 * Content transformation function type
 * Pure function that takes content and returns transformed content
 */
type ContentTransform = (content: string) => string;

/**
 * Normalizes blank-line pattern after H1 title
 * Ensures files with one or two blank lines after title are considered equivalent
 */
const normalizeForCompare = (s: string): string =>
  s.replace(/(^# .*?)\n+/m, '$1\n\n').trim() + '\n';

/**
 * Fixes section-based metadata by converting to inline format
 */
export async function fixTaskFile(filePath: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Auto-detect locale from content
    const locale = detectLocale(content);
    const i18n = getI18n(locale);

    // Build regex patterns for both English and localized names
    const statusPattern = new RegExp(
      `##\\s*(?:Status|${i18n.status})\\s*\\n\\s*([^\\n\\r]+)`,
      'i',
    );
    const typePattern = new RegExp(
      `##\\s*(?:Type|${i18n.type})\\s*\\n\\s*([^\\n\\r]+)`,
      'i',
    );
    const assigneePattern = new RegExp(
      `##\\s*(?:Assignee|${i18n.assignee})\\s*\\n\\s*([^\\n\\r]+)`,
      'i',
    );

    // Check if file has section-based metadata
    const hasSectionStatus = statusPattern.test(content);
    const hasSectionType = typePattern.test(content);
    const hasSectionAssignee = assigneePattern.test(content);

    // Check if inline metadata is missing trailing spaces (for markdown line breaks)
    const inlineStatusPattern = /^(Status|Tipo):\s*/i;
    const inlineTypePattern = /^(Type|Tipo):\s*/i;
    const inlineAssigneePattern = /^(Assignee|Responsável):\s*/i;

    const lines = content.split(/\r?\n/);
    const inlineStatusLine = lines.find((l) => inlineStatusPattern.test(l));
    const inlineTypeLine = lines.find((l) => inlineTypePattern.test(l));
    const inlineAssigneeLine = lines.find((l) => inlineAssigneePattern.test(l));

    const hasInlineStatus = !!inlineStatusLine;
    const hasInlineType = !!inlineTypeLine;
    const hasInlineAssignee = !!inlineAssigneeLine;

    const endsWithTwoSpaces = (line?: string) => !!line && /\s{2}$/.test(line);

    const needsSpaceFix =
      (hasInlineStatus && !endsWithTwoSpaces(inlineStatusLine)) ||
      (hasInlineType && !endsWithTwoSpaces(inlineTypeLine)) ||
      (hasInlineAssignee && !endsWithTwoSpaces(inlineAssigneeLine));

    // temporary debugging removed

    if (
      !hasSectionStatus &&
      !hasSectionType &&
      !hasSectionAssignee &&
      !needsSpaceFix
    ) {
      return false; // Nothing to fix
    }

    let newContent = content;
    let wasModified = false;

    // Fix section-based metadata if present
    if (hasSectionStatus || hasSectionType || hasSectionAssignee) {
      // Extract section-based metadata
      const statusMatch = content.match(statusPattern);
      const typeMatch = content.match(typePattern);
      const assigneeMatch = content.match(assigneePattern);

      // Remove section-based metadata
      if (statusMatch) {
        newContent = newContent.replace(statusPattern, '');
      }
      if (typeMatch) {
        newContent = newContent.replace(typePattern, '');
      }
      if (assigneeMatch) {
        newContent = newContent.replace(assigneePattern, '');
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
        inlineMetadata.push(`Status: ${statusMatch[1].trim()}  `);
      }

      if (typeMatch) {
        inlineMetadata.push(`Type: ${typeMatch[1].trim()}  `);
      }

      if (assigneeMatch) {
        inlineMetadata.push(`Assignee: ${assigneeMatch[1].trim()}  `);
      }

      // Reconstruct file
      newContent = [
        ...beforeTitle,
        '',
        ...inlineMetadata,
        '',
        ...afterTitle,
      ].join('\n');

      wasModified = true;
    }

    // Fix inline metadata missing trailing spaces
    if (needsSpaceFix) {
      newContent = newContent.replace(
        /^(Status|Tipo):\s*(.+?)([ \t]*)$/im,
        (_, key, value) => `${key}: ${value.trim()}  `,
      );
      newContent = newContent.replace(
        /^(Type|Tipo):\s*(.+?)([ \t]*)$/im,
        (_, key, value) => `${key}: ${value.trim()}  `,
      );
      newContent = newContent.replace(
        /^(Assignee|Responsável):\s*(.+?)([ \t]*)$/im,
        (_, key, value) => `${key}: ${value.trim()}  `,
      );
      wasModified = true;
    }

    // Clean up extra blank lines again
    const finalContentRaw = newContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';
    const originalContentRaw = content.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    // Normalize the blank-line pattern after the H1 title so that files with
    // one or two blank lines after the title are considered equivalent.
    const normalizeForCompare = (s: string) =>
      s.replace(/(^# .*?)\n+/m, '$1\n\n').trim() + '\n';

    const finalContent = normalizeForCompare(finalContentRaw);
    const normalizedOriginal = normalizeForCompare(originalContentRaw);

    if (filePath.endsWith('/tasks/task-001.md')) {
      // eslint-disable-next-line no-console
      console.debug('DEBUG-NORM COMPARE', {
        finalContentRaw: finalContentRaw.replace(/\n/g, '\\n'),
        originalContentRaw: originalContentRaw.replace(/\n/g, '\\n'),
        finalContent: finalContent.replace(/\n/g, '\\n'),
        normalizedOriginal: normalizedOriginal.replace(/\n/g, '\\n'),
      });
    }

    if (finalContent !== normalizedOriginal) {
      await writeFile(filePath, finalContent, 'utf-8');
      return true;
    }

    return false;
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

    // Auto-detect locale from content
    const locale = detectLocale(content);
    const i18n = getI18n(locale);

    // Check for required sections
    const hasTitleSection = lines.some((line) => line.trim().startsWith('# '));

    // Build regex patterns for both English and localized names
    const inlineStatusPattern = new RegExp(
      `^(?:Status|${i18n.status}):\\s*.+$`,
      'im',
    );
    const sectionStatusPattern = new RegExp(
      `##\\s*(?:Status|${i18n.status})`,
      'i',
    );

    // Enforce inline metadata only (no section-based '## Status')
    const hasInlineStatus = inlineStatusPattern.test(content);
    const hasSectionStatus = sectionStatusPattern.test(content);
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
        sectionStatusPattern.test(line.trim()),
      );
      issues.push({
        file: filePath,
        line: statusLineIdx >= 0 ? statusLineIdx + 1 : undefined,
        message:
          'Section-based metadata ("## Status") is not allowed. Use inline format instead.',
        severity: 'error',
        suggestion: `Replace section with inline metadata:\n${i18n.status}: <todo|in-progress|done>`,
      });
    }

    // Ensure inline status exists and is valid
    if (!hasInlineStatus) {
      issues.push({
        file: filePath,
        message: 'Task file must have a Status field',
        severity: 'error',
        suggestion: `Add inline metadata after title:\n${i18n.status}: <todo|in-progress|done>`,
      });
    } else {
      const statusMatch = content.match(inlineStatusPattern);
      // Extract value after colon
      const statusValue = statusMatch
        ? statusMatch[0].split(':')[1]?.trim().toLowerCase() || ''
        : '';
      if (
        ![
          'todo',
          'in-progress',
          'done',
          'pending',
          'blocked',
          'canceled',
        ].includes(statusValue)
      ) {
        const statusLineIdx = lines.findIndex((line) =>
          inlineStatusPattern.test(line.trim()),
        );
        issues.push({
          file: filePath,
          line: statusLineIdx >= 0 ? statusLineIdx + 1 : undefined,
          message:
            'Status must be one of: todo, in-progress, done, pending, blocked, canceled',
          severity: 'error',
          suggestion:
            'Set status to: todo, in-progress, done, pending, blocked, or canceled',
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
