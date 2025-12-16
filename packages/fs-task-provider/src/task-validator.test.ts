import * as fsp from 'node:fs/promises';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixTaskFile, validateTaskFile } from './task-validator';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

describe('task-validator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateTaskFile', () => {
    it('should accept valid inline format with valid status', async () => {
      const content = `# Task 001 — Valid Task
Status: todo
Type: feat
Assignee: John Doe

## Description
This is a valid task description.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/task-001-valid-task.md');
      const errors = result.filter((issue) => issue.severity === 'error');
      expect(errors).toHaveLength(0);
    });
    it('should reject section-based metadata format', async () => {
      const content = `# Task 001 — Invalid Task

## Status
pending

## Type
feat

## Assignee
John Doe

## Description
This task uses section-based metadata.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/task-001-invalid-task.md');
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some((issue) => issue.message.toLowerCase().includes('section')),
      ).toBe(true);
    });

    it('should detect missing Status field', async () => {
      const content = `# Task 001 — Missing Status
Type: feat

## Description
This task is missing the Status field.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile(
        '/tasks/task-001-missing-status.md',
      );
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(
          (issue) =>
            issue.message.includes('Status') ||
            issue.message.includes('status'),
        ),
      ).toBe(true);
    });

    it('should detect invalid status value', async () => {
      const content = `# Task 001 — Invalid Status
Status: invalid-status

## Description
This task has an invalid status.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile(
        '/tasks/task-001-invalid-status.md',
      );
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(
          (issue) =>
            issue.message.includes('Status') &&
            (issue.message.includes('todo') ||
              issue.message.includes('pending')),
        ),
      ).toBe(true);
    });

    it('should accept Portuguese content with English inline metadata', async () => {
      const content = `# Task 001 — Tarefa em Português
Status: pending
Type: feat
Assignee: João Silva

## Descrição
Esta é uma tarefa válida em português.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile(
        '/tasks/task-001-tarefa-em-portugues.md',
      );
      const errors = result.filter((issue) => issue.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should warn about missing description section', async () => {
      const content = `# Task 001 — No Description
Status: todo`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile(
        '/tasks/task-001-no-description.md',
      );
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(
          (issue) =>
            issue.severity === 'warning' &&
            issue.message.includes('description'),
        ),
      ).toBe(true);
    });

    it('should warn about invalid filename pattern', async () => {
      const content = `# Task 001 — Valid Content
Status: todo

## Description
Valid content but bad filename.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/invalid-filename.md');
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(
          (issue) =>
            issue.severity === 'warning' && issue.message.includes('filename'),
        ),
      ).toBe(true);
    });
  });

  describe('fixTaskFile', () => {
    it('should convert section metadata to inline format', async () => {
      const content = `# Task 001 — Test Task

## Status
pending

## Type
feat

## Assignee
John Doe

## Description
Test description`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      (fsp.writeFile as Mock).mockResolvedValue(undefined);

      const result = await fixTaskFile('/tasks/task-001.md');

      expect(result).toBe(true);
      expect(fsp.writeFile).toHaveBeenCalled();

      const writtenContent = (fsp.writeFile as Mock).mock.calls[0][1];
      expect(writtenContent).toContain('Status:');
      expect(writtenContent).toContain('Type:');
      expect(writtenContent).toContain('Assignee:');
      expect(writtenContent).not.toMatch(/## Status\n/);
      expect(writtenContent).not.toMatch(/## Type\n/);
      expect(writtenContent).not.toMatch(/## Assignee\n/);
    });

    it('should return false if no section metadata found', async () => {
      const content = `# Task 001 — Already Fixed
Status: done
Type: feat
Assignee: John Doe

## Description
Already in inline format.`;

      (fsp.readFile as Mock).mockResolvedValue(content);

      const result = await fixTaskFile('/tasks/task-001.md');

      expect(result).toBe(false);
      expect(fsp.writeFile).not.toHaveBeenCalled();
    });

    it('should handle partial section metadata', async () => {
      const content = `# Task 001 — Partial Section

## Status
pending

## Description
Only status is in section format.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      (fsp.writeFile as Mock).mockResolvedValue(undefined);

      const result = await fixTaskFile('/tasks/task-001.md');

      expect(result).toBe(true);
      expect(fsp.writeFile).toHaveBeenCalled();

      const writtenContent = (fsp.writeFile as Mock).mock.calls[0][1];
      expect(writtenContent).toContain('Status:');
      expect(writtenContent).not.toMatch(/## Status\n/);
    });

    it('should preserve existing sections when fixing section metadata', async () => {
      const content = `# Task 001 — Mixed Format

## Status
pending

## Type
feat

## Description
This is the description.

## Notes
These are notes.`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      (fsp.writeFile as Mock).mockResolvedValue(undefined);

      const result = await fixTaskFile('/tasks/task-001.md');

      expect(result).toBe(true);

      const writtenContent = (fsp.writeFile as Mock).mock.calls[0][1];
      expect(writtenContent).toContain('## Description');
      expect(writtenContent).toContain('This is the description.');
      expect(writtenContent).toContain('## Notes');
      expect(writtenContent).toContain('These are notes.');
    });

    it('should convert Portuguese section metadata to inline format', async () => {
      const content = `# Task 001 — Tarefa em Português

## Status
in-progress

## Tipo
feat

## Responsável
João Silva

## Descrição
Descrição da tarefa`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      (fsp.writeFile as Mock).mockResolvedValue(undefined);

      const result = await fixTaskFile('/tasks/task-001.md');

      expect(result).toBe(true);
      expect(fsp.writeFile).toHaveBeenCalled();

      const writtenContent = (fsp.writeFile as Mock).mock.calls[0][1];
      // Should convert to inline format (English keys)
      expect(writtenContent).toContain('Status: in-progress');
      expect(writtenContent).toContain('Type: feat');
      expect(writtenContent).toContain('Assignee: João Silva');
      // Should preserve Portuguese section
      expect(writtenContent).toContain('## Descrição');
      // Should remove Portuguese section-based metadata
      expect(writtenContent).not.toMatch(/## Status\n/);
      expect(writtenContent).not.toMatch(/## Tipo\n/);
      expect(writtenContent).not.toMatch(/## Responsável\n/);
    });

    it('should handle mixed English and Portuguese sections', async () => {
      const content = `# Task 001 — Mixed Language Task

## Status
pending

## Tipo
fix

## Descrição
Tarefa mista`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      (fsp.writeFile as Mock).mockResolvedValue(undefined);

      const result = await fixTaskFile('/tasks/task-001.md');

      expect(result).toBe(true);

      const writtenContent = (fsp.writeFile as Mock).mock.calls[0][1];
      expect(writtenContent).toContain('Status: pending');
      expect(writtenContent).toContain('Type: fix');
      expect(writtenContent).toContain('## Descrição');
    });
  });

  describe('multi-language validation', () => {
    it('should accept Portuguese content with English inline metadata', async () => {
      const content = `# Task 001 — Tarefa em Português
Status: in-progress
Type: feat
Assignee: João Silva

## Descrição
Descrição da tarefa`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/task-001-pt.md');
      const errors = result.filter((issue) => issue.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should reject Portuguese section-based format', async () => {
      const content = `# Task 001 — Tarefa em Português

## Status
em-progresso

## Tipo
feat

## Descrição
Descrição da tarefa`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/task-001-pt.md');
      expect(result.length).toBeGreaterThan(0);
      expect(
        result.some(
          (issue) =>
            issue.severity === 'error' &&
            issue.message.toLowerCase().includes('section'),
        ),
      ).toBe(true);
    });

    it('should validate status values in Portuguese format', async () => {
      const content = `# Task 001 — Tarefa Inválida
Status: status-invalido
Tipo: feat

## Descrição
Tarefa com status inválido`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/task-001-pt.md');
      const statusErrors = result.filter(
        (issue) =>
          issue.severity === 'error' && issue.message.includes('Status'),
      );
      expect(statusErrors.length).toBeGreaterThan(0);
    });

    it('should provide localized suggestions for Portuguese files', async () => {
      const content = `# Task 001 — Tarefa sem Status

## Descrição
Tarefa sem metadados`;

      (fsp.readFile as Mock).mockResolvedValue(content);
      const result = await validateTaskFile('/tasks/task-001-pt.md');
      const statusIssue = result.find((issue) =>
        issue.message.includes('Status'),
      );

      // Should suggest Portuguese field name since content is in Portuguese
      expect(statusIssue?.suggestion).toContain('Status:');
    });
  });
});
