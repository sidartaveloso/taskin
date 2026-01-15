/**
 * Git Analyzer Types
 * Types for analyzing Git repository history and extracting metrics
 */

import type { GitCommit } from '@opentask/taskin-types';

/**
 * Options for querying commits
 */
export interface CommitQueryOptions {
  /**
   * Filter commits since this date/time
   * Examples: "1 week ago", "2024-01-01", "7 days ago"
   */
  since?: string;

  /**
   * Filter commits until this date/time
   */
  until?: string;

  /**
   * Filter commits by author email or name
   */
  author?: string;

  /**
   * Filter commits that affected this file path
   */
  filePath?: string;

  /**
   * Maximum number of commits to return
   */
  maxCount?: number;

  /**
   * Include merge commits (default: false)
   */
  includeMerges?: boolean;
}

/**
 * Represents a file change in a commit
 */
export interface FileDiff {
  /** File path relative to repository root */
  path: string;

  /** Lines added in this file */
  linesAdded: number;

  /** Lines removed from this file */
  linesRemoved: number;

  /** Type of change */
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';

  /** Previous path if file was renamed */
  oldPath?: string;
}

/**
 * Represents the diff between two commits or working tree
 */
export interface Diff {
  /** Files changed */
  files: FileDiff[];

  /** Total lines added across all files */
  totalLinesAdded: number;

  /** Total lines removed across all files */
  totalLinesRemoved: number;

  /** Net change (added - removed) */
  netChange: number;
}

/**
 * Represents blame information for a file
 */
export interface BlameInfo {
  /** Line number (1-indexed) */
  lineNumber: number;

  /** Commit hash that last modified this line */
  commitHash: string;

  /** Author who last modified this line */
  author: string;

  /** Date when line was last modified */
  date: Date;

  /** The actual line content */
  content: string;
}

/**
 * Represents a Git author/contributor
 */
export interface Author {
  /** Author name */
  name: string;

  /** Author email */
  email: string;

  /** Number of commits by this author */
  commits: number;
}

/**
 * Git Analyzer Interface
 * Service for analyzing Git repository history
 */
export interface IGitAnalyzer {
  /**
   * Get commits from repository
   * @param options Query options to filter commits
   * @returns Array of commits matching the criteria
   */
  getCommits(options?: CommitQueryOptions): Promise<GitCommit[]>;

  /**
   * Get diff between two commits or working tree
   * @param from Starting commit (default: HEAD)
   * @param to Ending commit (default: working tree)
   * @returns Diff information
   */
  getDiff(from?: string, to?: string): Promise<Diff>;

  /**
   * Get diff for a specific file
   * @param filePath File path relative to repository root
   * @param from Starting commit (default: HEAD)
   * @param to Ending commit (default: working tree)
   * @returns Diff information for this file
   */
  getFileDiff(
    filePath: string,
    from?: string,
    to?: string,
  ): Promise<FileDiff | null>;

  /**
   * Get blame information for a file
   * @param filePath File path relative to repository root
   * @returns Blame information for each line
   */
  getBlame(filePath: string): Promise<BlameInfo[]>;

  /**
   * Get all unique authors/contributors
   * @param options Query options to filter commits
   * @returns Array of authors with commit counts
   */
  getAuthors(options?: CommitQueryOptions): Promise<Author[]>;

  /**
   * Get commits that affected a specific file
   * @param filePath File path relative to repository root
   * @param options Additional query options
   * @returns Array of commits that modified this file
   */
  getFileHistory(
    filePath: string,
    options?: CommitQueryOptions,
  ): Promise<GitCommit[]>;

  /**
   * Check if repository exists and is accessible
   * @returns True if repository is valid
   */
  isValidRepository(): Promise<boolean>;

  /**
   * Get repository root directory
   * @returns Absolute path to repository root
   */
  getRepositoryRoot(): Promise<string>;
}
