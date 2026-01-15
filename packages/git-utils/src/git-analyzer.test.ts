/**
 * Git Analyzer Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitAnalyzer } from './git-analyzer';
import * as child_process from 'child_process';

// Mock child_process.exec
vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof child_process>('child_process');
  return {
    ...actual,
    exec: vi.fn(),
  };
});

describe('GitAnalyzer', () => {
  let analyzer: GitAnalyzer;
  let execMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    analyzer = new GitAnalyzer();
    execMock = vi.mocked(child_process.exec);
    execMock.mockReset();
  });

  describe('isValidRepository', () => {
    it('should return true for valid git repository', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: 'true\n', stderr: '' });
      });

      const result = await analyzer.isValidRepository();
      expect(result).toBe(true);
    });

    it('should return false for non-git directory', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(new Error('not a git repo'), { stdout: '', stderr: '' });
      });

      const result = await analyzer.isValidRepository();
      expect(result).toBe(false);
    });
  });

  describe('getRepositoryRoot', () => {
    it('should return repository root path', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: '/path/to/repo\n', stderr: '' });
      });

      const result = await analyzer.getRepositoryRoot();
      expect(result).toBe('/path/to/repo');
    });

    it('should throw error if not a git repository', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(new Error('not a git repo'), { stdout: '', stderr: '' });
      });

      await expect(analyzer.getRepositoryRoot()).rejects.toThrow(
        'Not a git repository',
      );
    });
  });

  describe('getCommits', () => {
    it('should parse git log output correctly', async () => {
      const mockOutput = `abc123|John Doe|2026-01-08T10:00:00Z|feat: add feature\0
5\t2\tsrc/file.ts
3\t1\tsrc/other.ts

def456|Jane Smith|2026-01-07T15:30:00Z|fix: bug fix\0
10\t5\tsrc/bug.ts`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const commits = await analyzer.getCommits();

      expect(commits).toHaveLength(2);
      expect(commits[0]).toMatchObject({
        hash: 'abc123',
        author: 'John Doe',
        message: 'feat: add feature',
        filesChanged: 2,
        linesAdded: 8,
        linesRemoved: 3,
      });
    });

    it('should handle empty repository', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const commits = await analyzer.getCommits();
      expect(commits).toEqual([]);
    });

    it('should filter by author', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        expect(cmd).toContain('--author="John Doe"');
        callback(null, { stdout: '', stderr: '' });
      });

      await analyzer.getCommits({ author: 'John Doe' });
    });

    it('should filter by date range', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        expect(cmd).toContain('--since="1 week ago"');
        expect(cmd).toContain('--until="2026-01-08"');
        callback(null, { stdout: '', stderr: '' });
      });

      await analyzer.getCommits({
        since: '1 week ago',
        until: '2026-01-08',
      });
    });

    it('should extract co-authors from commit message', async () => {
      // Format: hash|author|date|subject\0body (body includes Co-authored-by, separated by actual newlines in string)
      // Then numstat lines on separate lines
      const bodyText = 'Co-authored-by: Jane Smith <jane@example.com>\nCo-authored-by: Bob Johnson <bob@example.com>';
      const mockOutput = `abc123|John Doe|2026-01-08T10:00:00Z|feat: add feature\0${bodyText}
5\t2\tsrc/file.ts`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const commits = await analyzer.getCommits();

      expect(commits[0].coAuthors).toEqual(['Jane Smith', 'Bob Johnson']);
    });
  });

  describe('getDiff', () => {
    it('should parse diff numstat output', async () => {
      const mockOutput = `10\t5\tsrc/file.ts
3\t2\tsrc/other.ts
7\t0\tsrc/new.ts`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const diff = await analyzer.getDiff();

      expect(diff.totalLinesAdded).toBe(20);
      expect(diff.totalLinesRemoved).toBe(7);
      expect(diff.netChange).toBe(13);
      expect(diff.files).toHaveLength(3);
    });

    it('should ignore binary files', async () => {
      const mockOutput = `10\t5\tsrc/file.ts
-\t-\timage.png
3\t2\tsrc/other.ts`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const diff = await analyzer.getDiff();

      expect(diff.files).toHaveLength(2);
      expect(diff.files.find((f) => f.path.includes('png'))).toBeUndefined();
    });
  });

  describe('getAuthors', () => {
    it('should parse shortlog output', async () => {
      const mockOutput = `   123  John Doe <john@example.com>
    45  Jane Smith <jane@example.com>
     7  Bob Johnson <bob@example.com>`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const authors = await analyzer.getAuthors();

      expect(authors).toHaveLength(3);
      expect(authors[0]).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        commits: 123,
      });
      expect(authors[1]).toEqual({
        name: 'Jane Smith',
        email: 'jane@example.com',
        commits: 45,
      });
    });

    it('should handle empty author list', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: '', stderr: '' });
      });

      const authors = await analyzer.getAuthors();
      expect(authors).toEqual([]);
    });
  });

  describe('getFileHistory', () => {
    it('should filter commits by file path', async () => {
      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        expect(cmd).toContain('-- src/file.ts');
        callback(null, { stdout: '', stderr: '' });
      });

      await analyzer.getFileHistory('src/file.ts');
    });
  });

  describe('getFileDiff', () => {
    it('should return file diff', async () => {
      const mockOutput = `10\t5\tsrc/file.ts`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const diff = await analyzer.getFileDiff('src/file.ts');

      expect(diff).toEqual({
        path: 'src/file.ts',
        linesAdded: 10,
        linesRemoved: 5,
        changeType: 'modified',
      });
    });

    it('should return null for binary files', async () => {
      const mockOutput = `-\t-\timage.png`;

      execMock.mockImplementation((cmd, opts, callback: (...args: unknown[]) => void) => {
        callback(null, { stdout: mockOutput, stderr: '' });
      });

      const diff = await analyzer.getFileDiff('image.png');
      expect(diff).toBeNull();
    });
  });
});
