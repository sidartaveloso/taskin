/**
 * Quick smoke tests for critical bugs
 * Tests that status updates are persisted to files
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const TEST_DIR = join(process.cwd(), 'test-smoke');

describe('Status Persistence Smoke Tests', () => {
  const setup = () => {
    // Clean and create test dir
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    // Create TASKS dir and sample task
    const tasksDir = join(TEST_DIR, 'TASKS');
    mkdirSync(tasksDir);

    const taskContent = `# Task 001 — Test Task

Status: pending
Type: feat
Assignee: developer

## Description
Test task`;

    writeFileSync(join(tasksDir, 'task-001-test.md'), taskContent);
    writeFileSync(
      join(TEST_DIR, '.taskin.json'),
      JSON.stringify({ provider: 'fs' }),
    );

    // Init git
    execSync('git init', { cwd: TEST_DIR });
    execSync('git config user.email "test@test.com"', { cwd: TEST_DIR });
    execSync('git config user.name "Test"', { cwd: TEST_DIR });
    execSync('git add -A && git commit -m "init"', { cwd: TEST_DIR });
  };

  const cleanup = () => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  };

  const readTaskFile = () => {
    return readFileSync(join(TEST_DIR, 'TASKS', 'task-001-test.md'), 'utf-8');
  };

  it('should persist status change when starting a task', () => {
    setup();

    try {
      const cliPath = join(process.cwd(), 'dist/index.js');

      // Execute start command
      execSync(`node ${cliPath} start 001`, {
        cwd: TEST_DIR,
        stdio: 'pipe',
      });

      // Read file and check status
      const content = readTaskFile();

      expect(content).toContain('Status: in-progress');
      expect(content).not.toContain('Status: pending');
    } finally {
      cleanup();
    }
  });

  it('should persist status change when finishing a task', () => {
    setup();

    try {
      const cliPath = join(process.cwd(), 'dist/index.js');

      // Start task first
      execSync(`node ${cliPath} start 001`, {
        cwd: TEST_DIR,
        stdio: 'pipe',
      });

      // Finish task
      execSync(`node ${cliPath} finish 001`, {
        cwd: TEST_DIR,
        stdio: 'pipe',
      });

      // Read file and check status
      const content = readTaskFile();

      expect(content).toContain('Status: done');
      expect(content).not.toContain('Status: in-progress');
      expect(content).not.toContain('Status: pending');
    } finally {
      cleanup();
    }
  });

  it('should reflect status changes in list command', () => {
    setup();

    try {
      const cliPath = join(process.cwd(), 'dist/index.js');

      // Start task
      execSync(`node ${cliPath} start 001`, {
        cwd: TEST_DIR,
        stdio: 'pipe',
      });

      // List tasks
      const listOutput = execSync(`node ${cliPath} list`, {
        cwd: TEST_DIR,
        encoding: 'utf-8',
      });

      expect(listOutput).toContain('in-progress');
      expect(listOutput).toMatch(/In Progress: 1/i);
    } finally {
      cleanup();
    }
  });
});
