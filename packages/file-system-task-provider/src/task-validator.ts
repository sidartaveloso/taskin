import { readFile, writeFile } from 'node:fs/promises';
import type { LintResult, ValidationIssue } from '@opentask/taskin-task-manager';
import { TASK_STATUSES } from '@opentask/taskin-types';
import { detectLocale, getI18n } from './i18n.js';
import {
  convertMetadataStyle,
  DEFAULT_METADATA_STYLE_ID,
  getMetadataStyle,
  type MetadataStyleId,
  readMetadataField,
  resolveMetadataStyle,
} from './metadata-style/index.js';

/**
 * Status values accepted in a task file.
 *
 * Derived from the canonical {@link TASK_STATUSES} so this validator can never
 * drift from the domain again — `in-review` used to be rejected here even
 * though `TaskManager.reviewTask` writes it. `todo` is kept as a legacy alias
 * for files written before `pending` became the canonical spelling.
 */
const ACCEPTED_STATUSES: readonly string[] = [...TASK_STATUSES, 'todo'];

const ACCEPTED_STATUSES_LABEL = ACCEPTED_STATUSES.join(', ');

/**
 * How `fixTaskFile` should mark the metadata block it writes.
 *
 * @public
 */
export interface FixTaskFileOptions {
  /** Style for a file that has no block to detect one from. */
  readonly metadataStyle?: MetadataStyleId;
  /**
   * When set, the block is rewritten in this style whatever the file used.
   * Unset, the file keeps its own style and is only normalized within it.
   */
  readonly convertTo?: MetadataStyleId;
}

/**
 * Migrates section-based metadata to the inline block, then normalizes the
 * block's marking.
 *
 * Normalizing used to mean "make sure every line ends with a backslash", which
 * put the break back on the last line — the very thing that renders as a stray
 * `\`. It now means "re-emit the block in one style", and which style is
 * decided by the file itself unless {@link FixTaskFileOptions.convertTo} says
 * otherwise.
 */
export async function fixTaskFile(filePath: string, options: FixTaskFileOptions = {}): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8');

    // Auto-detect locale from content
    const locale = detectLocale(content);
    const i18n = getI18n(locale);

    // Build regex patterns for both English and localized names
    const statusPattern = new RegExp(`##\\s*(?:Status|${i18n.status})\\s*\\n\\s*([^\\n\\r]+)`, 'i');
    const typePattern = new RegExp(`##\\s*(?:Type|${i18n.type})\\s*\\n\\s*([^\\n\\r]+)`, 'i');
    const assigneePattern = new RegExp(`##\\s*(?:Assignee|${i18n.assignee})\\s*\\n\\s*([^\\n\\r]+)`, 'i');

    const statusMatch = content.match(statusPattern);
    const typeMatch = content.match(typePattern);
    const assigneeMatch = content.match(assigneePattern);
    const hasSectionMetadata = !!(statusMatch || typeMatch || assigneeMatch);

    let newContent = content;

    // Fix section-based metadata if present
    if (hasSectionMetadata) {
      for (const pattern of [statusPattern, typePattern, assigneePattern]) {
        newContent = newContent.replace(pattern, '');
      }
      newContent = newContent.replace(/\n{3,}/g, '\n\n');

      if (!newContent.split('\n').some((line) => line.trim().startsWith('# '))) {
        return false; // No title found, can't fix
      }
    }

    /*
     * O estilo alvo: o pedido, ou o que o proprio arquivo ja usa. Resolvido
     * depois de remover as secoes e antes de reescrever, para que um arquivo
     * que so tinha `## Status` caia no default em vez de num estilo detectado
     * a partir de nada.
     */
    const style = options.convertTo
      ? getMetadataStyle(options.convertTo)
      : resolveMetadataStyle(newContent, options.metadataStyle ?? DEFAULT_METADATA_STYLE_ID);

    if (hasSectionMetadata) {
      const migrated: ReadonlyArray<readonly [string, string | undefined]> = [
        ['Status', statusMatch?.[1]?.trim()],
        ['Type', typeMatch?.[1]?.trim()],
        ['Assignee', assigneeMatch?.[1]?.trim()],
      ];

      for (const [label, value] of migrated) {
        if (value) newContent = style.write(newContent, label, value);
      }
    }

    /*
     * Reemite o bloco no estilo alvo. E aqui que a barra sai da ultima linha:
     * a versao anterior deste trecho exigia a quebra forte nas tres linhas e
     * portanto a recolocava.
     */
    newContent = convertMetadataStyle(newContent, style.id);

    // Clean up extra blank lines again
    const finalContentRaw = `${newContent.replace(/\n{3,}/g, '\n\n').trim()}\n`;
    const originalContentRaw = `${content.replace(/\n{3,}/g, '\n\n').trim()}\n`;

    // Normalize the blank-line pattern after the H1 title so that files with
    // one or two blank lines after the title are considered equivalent.
    const normalizeForCompare = (s: string) => `${s.replace(/(^# .*?)\n+/m, '$1\n\n').trim()}\n`;

    const finalContent = normalizeForCompare(finalContentRaw);
    const normalizedOriginal = normalizeForCompare(originalContentRaw);

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
export async function validateTaskFile(filePath: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Auto-detect locale from content
    const locale = detectLocale(content);
    const i18n = getI18n(locale);

    // Check for required sections
    const hasTitleSection = lines.some((line) => line.trim().startsWith('# '));

    const sectionStatusPattern = new RegExp(`##\\s*(?:Status|${i18n.status})`, 'i');

    /*
     * Lido pelo modulo de estilos, e nao por regex: `- Status: pending` e
     * `Status: pending\\` sao o mesmo campo, e ancorar em `^Status:` rejeitava
     * o primeiro com "Task file must have a Status field".
     */
    const inlineStatus = readMetadataField(content, i18n.status, 'Status');
    const isMetadataLine = (line: string) =>
      new RegExp(`^(?:-\\s+)?(?:Status|${i18n.status})\\s*:`, 'i').test(line.trim());

    // Enforce inline metadata only (no section-based '## Status')
    const hasInlineStatus = inlineStatus !== undefined;
    const hasSectionStatus = sectionStatusPattern.test(content);
    const hasDescriptionSection = content.includes('## Description') || content.includes('## Descrição');

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
      const statusLineIdx = lines.findIndex((line) => sectionStatusPattern.test(line.trim()));
      issues.push({
        file: filePath,
        line: statusLineIdx >= 0 ? statusLineIdx + 1 : undefined,
        message: 'Section-based metadata ("## Status") is not allowed. Use inline format instead.',
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
      const statusValue = (inlineStatus ?? '').toLowerCase();
      if (!ACCEPTED_STATUSES.includes(statusValue)) {
        const statusLineIdx = lines.findIndex(isMetadataLine);
        issues.push({
          file: filePath,
          line: statusLineIdx >= 0 ? statusLineIdx + 1 : undefined,
          message: `Status must be one of: ${ACCEPTED_STATUSES_LABEL}`,
          severity: 'error',
          suggestion: `Set status to one of: ${ACCEPTED_STATUSES_LABEL}`,
        });
      }
    }

    if (!hasDescriptionSection) {
      issues.push({
        file: filePath,
        message: 'Task file should have a description section (## Description or ## Descrição)',
        severity: 'warning',
        suggestion: 'Add a description section to explain the task',
      });
    }

    // Check for proper task ID format in filename
    const fileName = filePath.split('/').pop() || '';
    if (!fileName.match(/^task-\d{3}(?:-.*)?\.md$/)) {
      issues.push({
        file: filePath,
        message:
          'Task filename should follow pattern: task-NNN-description.md (e.g., task-001-my-task.md or task-001.md)',
        severity: 'warning',
        suggestion: 'Rename the file to match the pattern task-001-description.md',
      });
    }

    // Check for empty sections
    const titleLine = lines.findIndex((line) => line.trim().startsWith('# '));
    if (lines[titleLine]?.trim() === '#') {
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
  const errorCount = allIssues.filter((issue) => issue.severity === 'error').length;
  const warningCount = allIssues.filter((issue) => issue.severity === 'warning').length;
  const infoCount = allIssues.filter((issue) => issue.severity === 'info').length;

  return {
    valid: errorCount === 0,
    issues: allIssues,
    errorCount,
    warningCount,
    infoCount,
  };
}
