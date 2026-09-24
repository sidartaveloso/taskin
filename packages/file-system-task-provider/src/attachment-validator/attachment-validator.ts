import type { ValidationIssue } from '@opentask/taskin-task-manager';
import { promises as fs } from 'fs';
import path from 'path';
import { type ISizeReductionHint, SizeReductionHint } from '../size-reduction-hint/index.js';
import type {
  AttachmentException,
  AttachmentValidatorOptions,
  IAttachmentValidator,
} from './attachment-validator.types.js';

/** @public */
export const ATTACHMENT_EXCEPTIONS_FILE_NAME = '.taskin-attachment-exceptions.json';

const KB = 1024;

const kb = (bytes: number): string => `${Math.round(bytes / KB)} KB`;

const distinctSizes = (before: number, after: number): [string, string] =>
  kb(before) === kb(after) ? [`${before} bytes`, `${after} bytes`] : [kb(before), kb(after)];

const toPosixKey = (relative: string): string => relative.split(path.sep).join('/');

interface Attachment {
  readonly absolute: string;
  readonly key: string;
  readonly bytes: number;
}

interface ExceptionsFile {
  readonly entries: ReadonlyMap<string, Partial<AttachmentException>>;
  readonly issues: ValidationIssue[];
}

/** @public */
export class AttachmentValidator implements IAttachmentValidator {
  private readonly options: AttachmentValidatorOptions;
  private readonly hint: ISizeReductionHint;

  constructor(options: AttachmentValidatorOptions, hint: ISizeReductionHint = new SizeReductionHint()) {
    this.options = options;
    this.hint = hint;
  }

  async validate(): Promise<ValidationIssue[]> {
    const issues = await this.collectIssues();
    return issues.map((issue) => ({ ...issue, fixable: false }));
  }

  private async collectIssues(): Promise<ValidationIssue[]> {
    const attachments = await this.listAttachments(this.options.tasksDir);
    const exceptions = await this.readExceptions();
    const limit = this.options.maxAttachmentKb * KB;
    const issues: ValidationIssue[] = [...exceptions.issues];

    for (const attachment of attachments) {
      if (attachment.bytes <= limit) continue;
      const exception = exceptions.entries.get(attachment.key);
      const pinned = exception?.bytes;

      if (typeof pinned !== 'number') {
        issues.push({
          file: attachment.absolute,
          message: `${attachment.key} is ${kb(attachment.bytes)}, over the ${kb(limit)} limit for attachments.`,
          severity: 'error',
          suggestion: this.suggestionFor(attachment.key),
        });
      } else if (attachment.bytes > pinned) {
        const [was, now] = distinctSizes(pinned, attachment.bytes);
        issues.push({
          file: attachment.absolute,
          message: `${attachment.key} is exempt from the ${kb(limit)} limit at ${was}, but grew to ${now}.`,
          severity: 'error',
          suggestion: this.suggestionFor(attachment.key),
        });
      }
    }

    const byKey = new Map(attachments.map((attachment) => [attachment.key, attachment]));
    for (const [key, exception] of exceptions.entries) {
      const attachment = byKey.get(key);
      if (!attachment) {
        issues.push(this.exceptionIssue(`The exception for ${key} points at a file that does not exist.`));
      } else if (attachment.bytes <= limit) {
        issues.push(this.exceptionIssue(`${key} is ${kb(attachment.bytes)} and already fits the ${kb(limit)} limit.`));
      }
      if (typeof exception.reason !== 'string' || exception.reason.trim() === '') {
        issues.push({
          file: this.exceptionsFile(),
          message: `The exception for ${key} has no reason — say why this file may stay over the limit.`,
          severity: 'error',
        });
      }
    }

    return issues;
  }

  private exceptionsFile(): string {
    return path.join(this.options.taskinDir, ATTACHMENT_EXCEPTIONS_FILE_NAME);
  }

  private exceptionIssue(message: string): ValidationIssue {
    return {
      file: this.exceptionsFile(),
      message,
      severity: 'error',
      suggestion: `Remove the entry from ${ATTACHMENT_EXCEPTIONS_FILE_NAME}.`,
    };
  }

  private suggestionFor(key: string): string {
    const file = path.join(path.basename(this.options.tasksDir), key);
    return [
      this.hint.for(file),
      `If it must stay as it is, add it to .taskin/${ATTACHMENT_EXCEPTIONS_FILE_NAME} with its size in bytes and the reason.`,
    ].join('\n');
  }

  private async listAttachments(directory: string): Promise<Attachment[]> {
    let entries: import('fs').Dirent[];
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch {
      return [];
    }

    const found: Attachment[] = [];
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        found.push(...(await this.listAttachments(absolute)));
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() !== '.md') {
        const { size } = await fs.stat(absolute);
        found.push({ absolute, bytes: size, key: toPosixKey(path.relative(this.options.tasksDir, absolute)) });
      }
    }
    return found;
  }

  private async readExceptions(): Promise<ExceptionsFile> {
    let raw: string;
    try {
      raw = await fs.readFile(this.exceptionsFile(), 'utf-8');
    } catch {
      return { entries: new Map(), issues: [] };
    }

    const unreadable = (detail: string): ExceptionsFile => ({
      entries: new Map(),
      issues: [
        {
          file: this.exceptionsFile(),
          message: `${ATTACHMENT_EXCEPTIONS_FILE_NAME} cannot be read (${detail}), so no attachment is exempt.`,
          severity: 'error',
          suggestion:
            'Expected { "exceptions": { "<path relative to the tasks directory>": { "bytes": <number>, "reason": "<why>" } } }.',
        },
      ],
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return unreadable(error instanceof Error ? error.message : 'invalid JSON');
    }

    const exceptions = (parsed as { exceptions?: unknown } | null)?.exceptions;
    if (typeof exceptions !== 'object' || exceptions === null || Array.isArray(exceptions)) {
      return unreadable('no "exceptions" object');
    }

    const entries = new Map<string, Partial<AttachmentException>>();
    for (const [key, value] of Object.entries(exceptions)) {
      const entry = (typeof value === 'object' && value !== null ? value : {}) as Partial<AttachmentException>;
      entries.set(toPosixKey(key), entry);
    }
    return { entries, issues: [] };
  }
}
