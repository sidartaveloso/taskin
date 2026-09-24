import type { ValidationIssue } from '@opentask/taskin-task-manager';

/**
 * Checks the files kept alongside the tasks against the size limit.
 *
 * @public
 */
export interface IAttachmentValidator {
  validate(): Promise<ValidationIssue[]>;
}

/** @public */
export interface AttachmentValidatorOptions {
  /** The directory holding the task files and their attachments. */
  readonly tasksDir: string;
  /** Where `.taskin-attachment-exceptions.json` lives. */
  readonly taskinDir: string;
  /** The limit, per attachment file. */
  readonly maxAttachmentKb: number;
}

/**
 * An attachment allowed over the limit. `bytes` pins the size it had when it
 * was exempted: it may shrink, never grow.
 *
 * @public
 */
export interface AttachmentException {
  readonly bytes: number;
  readonly reason: string;
}
