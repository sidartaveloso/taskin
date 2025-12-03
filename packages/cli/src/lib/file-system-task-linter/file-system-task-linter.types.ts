/**
 * FileSystem task linter types
 * Re-exports from @opentask/taskin-types + FileSystem-specific extensions
 */

import type { TaskValidationIssue } from '@opentask/taskin-types';

export type { TaskMetadata, TaskValidationIssue } from '@opentask/taskin-types';

/**
 * FileSystem-specific validation error
 * Extends TaskValidationIssue with file-specific information
 */
export interface FileValidationError extends Omit<
  TaskValidationIssue,
  'taskId'
> {
  file: string;
}

/**
 * FileSystem-specific lint result
 * Contains file-based validation results
 */
export interface FileLintResult {
  errors: FileValidationError[];
  filesChecked: number;
  valid: boolean;
  warnings: FileValidationError[];
}

/**
 * FileSystem-specific task linter interface
 * Defines validation operations for file-based task providers
 */
export interface IFileSystemTaskLinter {
  /**
   * Lint all task files in a directory
   * @param tasksDir - Directory containing task markdown files
   * @returns Validation results for all files
   */
  lintDirectory(tasksDir: string): Promise<FileLintResult>;

  /**
   * Lint a single task file
   * @param filePath - Path to the task markdown file
   * @returns Array of validation errors found in the file
   */
  lintFile(filePath: string): Promise<FileValidationError[]>;

  /**
   * Validate task metadata
   * @param metadata - Task metadata to validate
   * @param fileName - Name of the file being validated
   * @returns Array of validation errors
   */
  validateMetadata(
    metadata: Record<string, unknown>,
    fileName: string,
  ): FileValidationError[];
}
