import { execSync } from 'child_process';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { HookRunner } from './hook-runner';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = execSync as Mock;

describe('HookRunner (IHookRunner implementation)', () => {
  let hookRunner: HookRunner;

  beforeEach(() => {
    vi.clearAllMocks();
    hookRunner = new HookRunner();
  });

  describe('executeHooks', () => {
    it('should execute hooks sequentially', async () => {
      mockedExecSync
        .mockReturnValueOnce(Buffer.from('output1'))
        .mockReturnValueOnce(Buffer.from('output2'));

      const results = await hookRunner.executeHooks(
        ['echo test1', 'echo test2'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].hook).toBe('echo test1');
      expect(results[1].success).toBe(true);
      expect(results[1].hook).toBe('echo test2');
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });

    it('should substitute template variables', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      await hookRunner.executeHooks(
        ['git checkout -b feat/task-{{taskId}}'],
        { taskId: '014', taskTitle: 'Test Task' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git checkout -b feat/task-014',
        expect.objectContaining({
          cwd: '.',
          timeout: 5000,
        }),
      );
    });

    it('should substitute multiple variables in one hook', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      await hookRunner.executeHooks(
        ['git commit -m "WIP: task-{{taskId}} - {{taskTitle}}"'],
        { taskId: '014', taskTitle: 'Add review' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git commit -m "WIP: task-014 - Add review"',
        expect.any(Object),
      );
    });

    it('should substitute baseBranch variable', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      await hookRunner.executeHooks(
        ['git merge origin/{{baseBranch}}'],
        { taskId: '014', taskTitle: 'Test', baseBranch: 'develop' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(mockedExecSync).toHaveBeenCalledWith(
        'git merge origin/develop',
        expect.any(Object),
      );
    });

    it('should stop on error when continueOnError is false', async () => {
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('Command failed');
        })
        .mockReturnValue(Buffer.from('ok'));

      const results = await hookRunner.executeHooks(
        ['failing-command', 'should-not-run'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Command failed');
      expect(mockedExecSync).toHaveBeenCalledTimes(1);
    });

    it('should continue on error when continueOnError is true', async () => {
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('Command failed');
        })
        .mockReturnValue(Buffer.from('ok'));

      const results = await hookRunner.executeHooks(
        ['failing-command', 'should-run'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: true, cwd: '.' },
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Command failed');
      expect(results[1].success).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
    });

    it('should measure execution duration', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      const results = await hookRunner.executeHooks(
        ['echo test'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results[0].duration).toBeGreaterThanOrEqual(0);
      expect(typeof results[0].duration).toBe('number');
    });

    it('should capture stdout output', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('test output\n'));

      const results = await hookRunner.executeHooks(
        ['echo test'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results[0].output).toBe('test output');
    });

    it('should handle empty hooks array', async () => {
      const results = await hookRunner.executeHooks(
        [],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results).toHaveLength(0);
      expect(mockedExecSync).not.toHaveBeenCalled();
    });

    it('should pass correct options to execSync', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      await hookRunner.executeHooks(
        ['test command'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 60000, continueOnError: false, cwd: '/custom/path' },
      );

      expect(mockedExecSync).toHaveBeenCalledWith(
        'test command',
        expect.objectContaining({
          cwd: '/custom/path',
          timeout: 60000,
          encoding: 'buffer',
        }),
      );
    });

    it('should handle hooks with special characters', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      await hookRunner.executeHooks(
        ['echo "Task: {{taskTitle}}" > output.txt'],
        { taskId: '014', taskTitle: 'Test & Review' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(mockedExecSync).toHaveBeenCalledWith(
        'echo "Task: Test & Review" > output.txt',
        expect.any(Object),
      );
    });

    it('should preserve undefined optional variables', async () => {
      mockedExecSync.mockReturnValue(Buffer.from('ok'));

      await hookRunner.executeHooks(
        ['echo {{baseBranch}}'],
        { taskId: '014', taskTitle: 'Test' }, // no baseBranch
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      // Should not substitute undefined variables
      expect(mockedExecSync).toHaveBeenCalledWith(
        'echo {{baseBranch}}',
        expect.any(Object),
      );
    });

    it('should handle error objects correctly', async () => {
      const error = new Error('Test error');
      mockedExecSync.mockImplementationOnce(() => {
        throw error;
      });

      const results = await hookRunner.executeHooks(
        ['failing-command'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results[0].error).toBe('Test error');
    });

    it('should handle non-Error throws', async () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw 'string error';
      });

      const results = await hookRunner.executeHooks(
        ['failing-command'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results[0].error).toBe('string error');
      expect(results[0].success).toBe(false);
    });
  });
});
