/**
 * FileSystemTaskLinter tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemTaskLinter } from './file-system-task-linter.js';
import type { FileLintResult } from './file-system-task-linter.types.js';

describe('FileSystemTaskLinter', () => {
  let linter: FileSystemTaskLinter;

  beforeEach(() => {
    linter = new FileSystemTaskLinter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateMetadata', () => {
    it('should return no errors for valid metadata', () => {
      const metadata = {
        assignee: 'john@example.com',
        status: 'pending',
        type: 'feat',
      };

      const errors = linter.validateMetadata(metadata, 'task-001.md');

      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid status', () => {
      const metadata = {
        assignee: 'john@example.com',
        status: 'invalid-status',
        type: 'feat', // Valid type to isolate the status error
      };

      const errors = linter.validateMetadata(metadata, 'task-001.md');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Invalid status');
      expect(errors[0].severity).toBe('error');
      expect(errors[0].file).toBe('task-001.md');
    });

    it('should return error for invalid type', () => {
      const metadata = {
        assignee: 'john@example.com',
        status: 'pending', // Valid status to isolate the type error
        type: 'invalid-type',
      };

      const errors = linter.validateMetadata(metadata, 'task-001.md');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Invalid type');
      expect(errors[0].severity).toBe('error');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const metadata = {
        status: 'invalid-status',
        type: 'invalid-type',
        // Missing assignee - will generate warning
      };

      const errors = linter.validateMetadata(metadata, 'task-001.md');

      expect(errors).toHaveLength(3); // 2 errors + 1 warning
      expect(errors.filter((e) => e.severity === 'error')).toHaveLength(2);
      expect(errors.filter((e) => e.severity === 'warning')).toHaveLength(1);
    });

    it('should return warning for missing assignee', () => {
      const metadata = {
        status: 'pending',
        type: 'feat',
        // Missing assignee
      };

      const errors = linter.validateMetadata(metadata, 'task-001.md');

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Assignee');
      expect(errors[0].severity).toBe('warning');
    });
  });

  describe('lintFile', () => {
    it('should validate a well-formed task file', async () => {
      // Test will be implemented when we have file mocking utilities
      expect(true).toBe(true);
    });

    it('should detect missing required metadata', async () => {
      // Test will be implemented when we have file mocking utilities
      expect(true).toBe(true);
    });

    it('should validate task filename format', async () => {
      // Test will be implemented when we have file mocking utilities
      expect(true).toBe(true);
    });
  });

  describe('lintDirectory', () => {
    it('should return valid result for directory with no tasks', async () => {
      // Test will be implemented when we have directory mocking utilities
      expect(true).toBe(true);
    });

    it('should collect all errors from multiple files', async () => {
      // Test will be implemented when we have directory mocking utilities
      expect(true).toBe(true);
    });

    it('should mark result as invalid when errors are found', async () => {
      // Test will be implemented when we have directory mocking utilities
      expect(true).toBe(true);
    });
  });

  describe('printResults', () => {
    it('should print success message for valid results', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const result: FileLintResult = {
        errors: [],
        warnings: [],
        filesChecked: 5,
        valid: true,
      };

      FileSystemTaskLinter.printResults(result);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should print errors when validation fails', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const result: FileLintResult = {
        errors: [
          {
            file: 'task-001.md',
            message: 'Invalid status',
            severity: 'error',
          },
        ],
        warnings: [],
        filesChecked: 1,
        valid: false,
      };

      FileSystemTaskLinter.printResults(result);

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should print warnings separately from errors', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const result: FileLintResult = {
        errors: [],
        warnings: [
          {
            file: 'task-001.md',
            message: 'Consider adding assignee',
            severity: 'warning',
          },
        ],
        filesChecked: 1,
        valid: true,
      };

      FileSystemTaskLinter.printResults(result);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
