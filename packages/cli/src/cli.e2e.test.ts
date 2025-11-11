/**
 * End-to-end tests for Taskin CLI
 * Tests the complete workflow including file persistence
 */

import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execAsync = promisify(exec);

const TEST_DIR = join(process.cwd(), 'test-temp-e2e');
const CLI_PATH = join(process.cwd(), 'dist/index.js');

describe.sequential('Taskin CLI E2E Tests', () => {
  beforeEach(async () => {
    // Create clean test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    // Initialize git repo sequentially
    await execAsync('git init', { cwd: TEST_DIR });
    await execAsync('git config user.email "test@test.com"', { cwd: TEST_DIR });
    await execAsync('git config user.name "Test User"', { cwd: TEST_DIR });
  }, 60000);

  afterEach(() => {
    // Cleanup
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }, 60000);

  describe.sequential('taskin init', () => {
    it('should initialize taskin project structure', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });

      expect(stdout).toContain('initialized successfully');
      expect(existsSync(join(TEST_DIR, 'TASKS'))).toBe(true);
      expect(existsSync(join(TEST_DIR, '.taskin.json'))).toBe(true);
    }, 60000);

    it('should create a sample task file', async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });

      const tasksDir = join(TEST_DIR, 'TASKS');
      const files = await execAsync('ls', { cwd: tasksDir });

      expect(files.stdout).toContain('task-001');
    }, 60000);
  });

  describe.sequential('taskin list', () => {
    beforeEach(async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });
    }, 60000);

    it('should list all tasks', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} list`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('Task List');
      expect(stdout).toContain('001');
      expect(stdout).toContain('pending');
    }, 60000);

    it('should show task count summary', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} list`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toMatch(/Total: \d+ task/);
      expect(stdout).toMatch(/Pending: \d+/);
    }, 60000);
  });

  describe.sequential('taskin lint', () => {
    beforeEach(async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });
    }, 60000);

    it('should validate valid task files', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} lint`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('valid');
    }, 60000);

    it('should detect invalid task files', async () => {
      const invalidTaskPath = join(TEST_DIR, 'TASKS', 'task-002-invalid.md');
      writeFileSync(invalidTaskPath, '# Invalid Task\n\nNo metadata here');

      try {
        await execAsync(`node ${CLI_PATH} lint`, {
          cwd: TEST_DIR,
        });
      } catch (error: any) {
        expect(error.stdout || error.stderr).toContain('error');
      }
    }, 60000);
  });

  describe.sequential('taskin start', () => {
    beforeEach(async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });
      await execAsync('git add -A && git commit -m "initial"', {
        cwd: TEST_DIR,
      });
    }, 60000);

    it('should start a task and update status in file', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} start 001`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('started successfully');

      // Check if status was actually updated in the file
      const taskFiles = await execAsync('ls TASKS/', { cwd: TEST_DIR });
      const taskFile = taskFiles.stdout
        .split('\n')
        .find((f) => f.includes('001'));
      const taskPath = join(TEST_DIR, 'TASKS', taskFile!);
      const content = readFileSync(taskPath, 'utf-8');

      expect(content).toContain('Status: in-progress');
      expect(content).not.toContain('Status: pending');
    }, 60000);

    it('should reflect status change in list command', async () => {
      await execAsync(`node ${CLI_PATH} start 001`, { cwd: TEST_DIR });

      const { stdout } = await execAsync(`node ${CLI_PATH} list`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('in-progress');
      expect(stdout).toMatch(/In Progress: 1/);
      expect(stdout).toMatch(/Pending: 0/);
    }, 60000);

    it('should fail if task does not exist', async () => {
      try {
        await execAsync(`node ${CLI_PATH} start 999`, { cwd: TEST_DIR });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(1);
      }
    }, 60000);
  });

  describe.sequential('taskin pause', () => {
    beforeEach(async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });
      await execAsync('git add -A && git commit -m "initial"', {
        cwd: TEST_DIR,
      });
      await execAsync(`node ${CLI_PATH} start 001`, { cwd: TEST_DIR });
    }, 60000);

    it('should pause an in-progress task', async () => {
      // Make some changes
      writeFileSync(join(TEST_DIR, 'test.txt'), 'test content');
      await execAsync('git add test.txt', { cwd: TEST_DIR });

      const { stdout } = await execAsync(`node ${CLI_PATH} pause 001`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('paused');

      // Verify git commit was made
      const { stdout: logOutput } = await execAsync('git log --oneline', {
        cwd: TEST_DIR,
      });
      expect(logOutput).toContain('WIP');
    }, 60000);

    it('should fail if task is not in progress', async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });

      try {
        await execAsync(`node ${CLI_PATH} pause 001`, { cwd: TEST_DIR });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('not in progress');
      }
    }, 60000);
  });

  describe.sequential('taskin finish', () => {
    beforeEach(async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });
      await execAsync('git add -A && git commit -m "initial"', {
        cwd: TEST_DIR,
      });
      await execAsync(`node ${CLI_PATH} start 001`, { cwd: TEST_DIR });
    }, 60000);

    it('should finish a task and update status in file', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} finish 001`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('completed');

      // Check if status was actually updated in the file
      const taskFiles = await execAsync('ls TASKS/', { cwd: TEST_DIR });
      const taskFile = taskFiles.stdout
        .split('\n')
        .find((f) => f.includes('001'));
      const taskPath = join(TEST_DIR, 'TASKS', taskFile!);
      const content = readFileSync(taskPath, 'utf-8');

      expect(content).toContain('Status: done');
      expect(content).not.toContain('Status: in-progress');
      expect(content).not.toContain('Status: pending');
    }, 60000);

    it('should reflect status change in list command', async () => {
      await execAsync(`node ${CLI_PATH} finish 001`, { cwd: TEST_DIR });

      const { stdout } = await execAsync(`node ${CLI_PATH} list`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('done');
      expect(stdout).toMatch(/Done: 1/);
      expect(stdout).toMatch(/In Progress: 0/);
    }, 60000);

    it('should provide commit message suggestion', async () => {
      const { stdout } = await execAsync(`node ${CLI_PATH} finish 001`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('commit message');
    }, 60000);
  });

  describe.sequential('workflow integration', () => {
    beforeEach(async () => {
      await execAsync(`node ${CLI_PATH} init`, {
        cwd: TEST_DIR,
        env: { ...process.env, CI: 'true' },
      });
      await execAsync('git add -A && git commit -m "initial"', {
        cwd: TEST_DIR,
      });
    }, 60000);

    it('should support complete workflow: start -> pause -> start -> finish', async () => {
      // Start task
      await execAsync(`node ${CLI_PATH} start 001`, { cwd: TEST_DIR });

      let listOutput = await execAsync(`node ${CLI_PATH} list`, {
        cwd: TEST_DIR,
      });
      expect(listOutput.stdout).toContain('in-progress');

      // Make changes and pause
      writeFileSync(join(TEST_DIR, 'work.txt'), 'progress 1');
      await execAsync('git add work.txt', { cwd: TEST_DIR });
      await execAsync(`node ${CLI_PATH} pause 001`, { cwd: TEST_DIR });

      // Continue work
      await execAsync(`node ${CLI_PATH} start 001`, { cwd: TEST_DIR });
      writeFileSync(join(TEST_DIR, 'work.txt'), 'progress 2');
      await execAsync('git add work.txt', { cwd: TEST_DIR });

      // Finish
      await execAsync(`node ${CLI_PATH} finish 001`, { cwd: TEST_DIR });

      listOutput = await execAsync(`node ${CLI_PATH} list`, { cwd: TEST_DIR });
      expect(listOutput.stdout).toContain('done');
      expect(listOutput.stdout).toMatch(/Done: 1/);
    }, 60000);

    it('should handle multiple tasks', async () => {
      // Create additional tasks
      const task2Path = join(TEST_DIR, 'TASKS', 'task-002-feature-b.md');
      const task2Content = `# Task 002 — Feature B

Status: pending
Type: feat
Assignee: developer

## Description
Another task`;

      writeFileSync(task2Path, task2Content);

      const { stdout } = await execAsync(`node ${CLI_PATH} list`, {
        cwd: TEST_DIR,
      });

      expect(stdout).toContain('001');
      expect(stdout).toContain('002');
      expect(stdout).toMatch(/Total: 2 task/);
    }, 60000);
  });

  describe.sequential('error handling', () => {
    it('should show helpful error when not in a taskin project', async () => {
      try {
        await execAsync(`node ${CLI_PATH} list`, { cwd: TEST_DIR });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('not initialized');
      }
    }, 60000);

    it('should show helpful error when TASKS directory is missing', async () => {
      writeFileSync(join(TEST_DIR, '.taskin.json'), '{"provider": "fs"}');

      try {
        await execAsync(`node ${CLI_PATH} list`, { cwd: TEST_DIR });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.stdout).toContain('TASKS');
      }
    }, 60000);
  });
});
