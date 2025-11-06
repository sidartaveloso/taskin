/**
 * FileSystemTaskLinter mocks for testing
 */

import type {
  FileLintResult,
  FileValidationError,
  IFileSystemTaskLinter,
  TaskMetadata,
} from './file-system-task-linter.types.js';

/**
 * Create mock FileValidationError
 */
export function createMockFileValidationError(
  overrides?: Partial<FileValidationError>,
): FileValidationError {
  return {
    file: 'task-001.md',
    message: 'Mock validation error',
    severity: 'error',
    ...overrides,
  };
}

/**
 * Create mock FileLintResult
 */
export function createMockFileLintResult(
  overrides?: Partial<FileLintResult>,
): FileLintResult {
  return {
    errors: [],
    filesChecked: 0,
    valid: true,
    warnings: [],
    ...overrides,
  };
}

/**
 * Create mock TaskMetadata
 */
export function createMockTaskMetadata(
  overrides?: Partial<TaskMetadata>,
): TaskMetadata {
  return {
    assignee: 'john@example.com',
    status: 'pending',
    type: 'feat',
    ...overrides,
  };
}

/**
 * Mock implementation of IFileSystemTaskLinter
 */
export class MockFileSystemTaskLinter implements IFileSystemTaskLinter {
  private mockLintDirectoryResult: FileLintResult = createMockFileLintResult();
  private mockLintFileResult: FileValidationError[] = [];
  private mockValidateMetadataResult: FileValidationError[] = [];

  async lintDirectory(_tasksDir: string): Promise<FileLintResult> {
    return this.mockLintDirectoryResult;
  }

  async lintFile(_filePath: string): Promise<FileValidationError[]> {
    return this.mockLintFileResult;
  }

  validateMetadata(
    _metadata: Record<string, unknown>,
    _fileName: string,
  ): FileValidationError[] {
    return this.mockValidateMetadataResult;
  }

  /**
   * Set mock result for lintDirectory
   */
  setLintDirectoryResult(result: FileLintResult): void {
    this.mockLintDirectoryResult = result;
  }

  /**
   * Set mock result for lintFile
   */
  setLintFileResult(result: FileValidationError[]): void {
    this.mockLintFileResult = result;
  }

  /**
   * Set mock result for validateMetadata
   */
  setValidateMetadataResult(result: FileValidationError[]): void {
    this.mockValidateMetadataResult = result;
  }
}

/**
 * Create a mock FileSystemTaskLinter instance
 */
export function createMockFileSystemTaskLinter(): MockFileSystemTaskLinter {
  return new MockFileSystemTaskLinter();
}

/**
 * Mock valid lint result - no errors, all files valid
 */
export const MOCK_VALID_LINT_RESULT: FileLintResult = {
  errors: [],
  filesChecked: 5,
  valid: true,
  warnings: [],
};

/**
 * Mock invalid lint result - has errors
 */
export const MOCK_INVALID_LINT_RESULT: FileLintResult = {
  errors: [
    createMockFileValidationError({
      file: 'task-001.md',
      message: 'Invalid status: "invalid"',
    }),
    createMockFileValidationError({
      file: 'task-002.md',
      message: 'Invalid type: "unknown"',
    }),
  ],
  filesChecked: 2,
  valid: false,
  warnings: [],
};

/**
 * Mock lint result with warnings only
 */
export const MOCK_WARNINGS_LINT_RESULT: FileLintResult = {
  errors: [],
  filesChecked: 3,
  valid: true,
  warnings: [
    createMockFileValidationError({
      file: 'task-003.md',
      message: 'Consider adding assignee',
      severity: 'warning',
    }),
  ],
};

/**
 * Mock sample validation errors
 */
export const MOCK_VALIDATION_ERRORS: FileValidationError[] = [
  createMockFileValidationError({
    file: 'task-001.md',
    message:
      'Invalid status: must be one of [pending, in-progress, done, blocked]',
    line: 5,
  }),
  createMockFileValidationError({
    file: 'task-001.md',
    message:
      'Invalid type: must be one of [feat, fix, chore, docs, refactor, test]',
    line: 6,
  }),
];

/**
 * Mock sample task metadata - valid
 */
export const MOCK_VALID_METADATA: TaskMetadata = {
  assignee: 'john@example.com',
  status: 'pending',
  type: 'feat',
};

/**
 * Mock sample task metadata - invalid
 */
export const MOCK_INVALID_METADATA: Record<string, unknown> = {
  assignee: 'john@example.com',
  status: 'invalid-status',
  type: 'invalid-type',
};
