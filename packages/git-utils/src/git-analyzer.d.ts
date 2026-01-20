/**
 * Git Analyzer Implementation
 * Service for analyzing Git repository history and extracting metrics
 */
import type { GitCommit } from '@opentask/taskin-types';
import type {
  Author,
  BlameInfo,
  CommitQueryOptions,
  Diff,
  FileDiff,
  IGitAnalyzer,
} from './git-analyzer.types';
/**
 * Git Analyzer implementation using git CLI
 */
export declare class GitAnalyzer implements IGitAnalyzer {
  private readonly repositoryPath?;
  constructor(repositoryPath?: string | undefined);
  isValidRepository(): Promise<boolean>;
  getRepositoryRoot(): Promise<string>;
  getCommits(options?: CommitQueryOptions): Promise<GitCommit[]>;
  private parseCommits;
  private extractCoAuthors;
  getDiff(from?: string, to?: string): Promise<Diff>;
  private parseDiff;
  getFileDiff(
    filePath: string,
    from?: string,
    to?: string,
  ): Promise<FileDiff | null>;
  getBlame(filePath: string): Promise<BlameInfo[]>;
  private parseBlame;
  getAuthors(options?: CommitQueryOptions): Promise<Author[]>;
  private parseAuthors;
  getFileHistory(
    filePath: string,
    options?: CommitQueryOptions,
  ): Promise<GitCommit[]>;
}
//# sourceMappingURL=git-analyzer.d.ts.map
