/**
 * FileSystemTaskLinter tests
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileSystemTaskLinter } from './file-system-task-linter.js';
import type { FileLintResult } from './file-system-task-linter.types.js';

const TAREFA_VALIDA = `# 🧩 Task 001 — Uma tarefa bem formada

- Status: pending
- Type: feat
- Assignee: john@example.com

## Description
Existe para o linter ter o que aprovar.
`;

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
      expect(errors[0]?.message).toContain('Invalid status');
      expect(errors[0]?.severity).toBe('error');
      expect(errors[0]?.file).toBe('task-001.md');
    });

    it('should return error for invalid type', () => {
      const metadata = {
        assignee: 'john@example.com',
        status: 'pending', // Valid status to isolate the type error
        type: 'invalid-type',
      };

      const errors = linter.validateMetadata(metadata, 'task-001.md');

      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Invalid type');
      expect(errors[0]?.severity).toBe('error');
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
      expect(errors[0]?.message).toContain('Assignee');
      expect(errors[0]?.severity).toBe('warning');
    });
  });

  describe('lintFile', () => {
    let dir: string;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), 'taskin-lint-file-'));
    });

    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it('should validate a well-formed task file', async () => {
      const filePath = join(dir, 'task-001-uma-tarefa-bem-formada.md');
      writeFileSync(filePath, TAREFA_VALIDA, 'utf-8');

      const errors = await linter.lintFile(filePath);

      expect(errors).toHaveLength(0);
    });

    it('should detect missing required metadata', async () => {
      const filePath = join(dir, 'task-002-sem-metadados.md');
      writeFileSync(filePath, '# 🧩 Task 002 — Sem metadados\n\n## Description\nNada.\n', 'utf-8');

      const errors = await linter.lintFile(filePath);

      const messages = errors.map((e) => e.message);
      expect(messages).toContain('Missing required metadata: Status');
      expect(messages).toContain('Missing required metadata: Type');
      expect(errors.filter((e) => e.severity === 'error').length).toBeGreaterThanOrEqual(2);
    });

    it('should validate task filename format', async () => {
      const filePath = join(dir, 'not-a-task.md');
      writeFileSync(filePath, TAREFA_VALIDA, 'utf-8');

      const errors = await linter.lintFile(filePath);

      expect(errors.some((e) => e.message.includes('Invalid filename'))).toBe(true);
    });
  });

  describe('lintDirectory', () => {
    let dir: string;

    beforeEach(() => {
      dir = mkdtempSync(join(tmpdir(), 'taskin-lint-dir-'));
    });

    afterEach(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it('should return valid result for directory with no tasks', async () => {
      const result = await linter.lintDirectory(dir);

      expect(result.valid).toBe(true);
      expect(result.filesChecked).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all errors from multiple files', async () => {
      writeFileSync(join(dir, 'task-001-status-invalido.md'), TAREFA_VALIDA.replace('pending', 'bogus'), 'utf-8');
      writeFileSync(join(dir, 'task-002-tipo-invalido.md'), TAREFA_VALIDA.replace('feat', 'bogus'), 'utf-8');

      const result = await linter.lintDirectory(dir);

      expect(result.filesChecked).toBe(2);
      expect(result.errors.some((e) => e.file === 'task-001-status-invalido.md')).toBe(true);
      expect(result.errors.some((e) => e.file === 'task-002-tipo-invalido.md')).toBe(true);
    });

    it('should mark result as invalid when errors are found', async () => {
      writeFileSync(join(dir, 'task-001-status-invalido.md'), TAREFA_VALIDA.replace('pending', 'bogus'), 'utf-8');

      const result = await linter.lintDirectory(dir);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
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
