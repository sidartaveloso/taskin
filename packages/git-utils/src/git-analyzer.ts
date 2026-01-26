/**
 * Git Analyzer Implementation
 * Service for analyzing Git repository history and extracting metrics
 */

import type { GitCommit } from '@opentask/taskin-types';
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  Author,
  BlameInfo,
  CommitQueryOptions,
  Diff,
  FileDiff,
  IGitAnalyzer,
} from './git-analyzer.types';

const execAsync = promisify(exec);

/**
 * Type guard to check if an error is a Node.js system error
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * Executes a git command and returns the output
 */
async function executeGit(command: string, cwd?: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`git ${command}`, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large repos
      timeout: 30000, // 30 second timeout
    });
    return stdout.trim();
  } catch (error) {
    // Use type guard for better type safety
    if (isNodeError(error)) {
      if (error.code === 'ENOENT') {
        throw new Error('Git is not installed or not in PATH');
      }
      // Other git errors are handled gracefully by returning empty string
      // This allows the system to continue operating even if git commands fail
      // (e.g., repository not found, permission errors, etc.)
    }
    // Return empty string for graceful degradation
    return '';
  }
}

/**
 * Git Analyzer implementation using git CLI
 */
export class GitAnalyzer implements IGitAnalyzer {
  constructor(private readonly repositoryPath?: string) {}

  async isValidRepository(): Promise<boolean> {
    try {
      const result = await executeGit(
        'rev-parse --is-inside-work-tree',
        this.repositoryPath,
      );
      return result === 'true';
    } catch {
      return false;
    }
  }

  async getRepositoryRoot(): Promise<string> {
    const result = await executeGit(
      'rev-parse --show-toplevel',
      this.repositoryPath,
    );
    if (!result) {
      throw new Error('Not a git repository');
    }
    return result;
  }

  async getCommits(options: CommitQueryOptions = {}): Promise<GitCommit[]> {
    const args: string[] = ['log'];

    // Format: hash|author|date|subject%x00%body
    // Use single quotes to prevent shell interpretation of format string
    args.push(
      "--pretty='format:%H|%an|%aI|%s%x00%b'",
      '--numstat', // Get file stats
    );

    if (options.since) {
      args.push(`--since="${options.since}"`);
    }

    if (options.until) {
      args.push(`--until=${options.until}`);
    }

    if (options.author) {
      args.push(`--author='${options.author}'`);
    }

    if (options.maxCount) {
      args.push(`-n ${options.maxCount}`);
    }

    if (!options.includeMerges) {
      args.push('--no-merges');
    }

    if (options.filePath) {
      args.push('--', options.filePath);
    }

    const command = args.join(' ');
    const output = await executeGit(command, this.repositoryPath);

    if (!output) {
      return [];
    }

    return this.parseCommits(output);
  }

  private parseCommits(output: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = output.split('\n');

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) {
        i++;
        continue;
      }

      // Parse commit header - must have pipe-separated parts (hash|author|date|message)
      // allow abbreviated hashes (6-40 hex chars) and be case-insensitive
      if (line.includes('|')) {
        const parts = line.split('|');

        // Validate we have all required parts and first part looks like a hash
        if (parts.length < 4 || !/^[0-9a-f]{6,40}$/i.test(parts[0])) {
          i++;
          continue;
        }

        const [hash, author, date, messageWithBody] = parts;

        // Split by null byte (character code 0)
        const nullByteIndex = messageWithBody?.indexOf('\0') ?? -1;
        const subject =
          nullByteIndex !== -1
            ? messageWithBody.substring(0, nullByteIndex)
            : messageWithBody || '';

        // Body might span multiple lines until we hit numstat
        let bodyLines: string[] = [];
        if (nullByteIndex !== -1) {
          // Get rest of body from current line
          bodyLines.push(messageWithBody.substring(nullByteIndex + 1));
        }

        // Collect body lines until we hit numstat (lines with \t) or next commit (lines with |)
        i++;
        while (
          i < lines.length &&
          !lines[i].includes('|') &&
          !lines[i].includes('\t')
        ) {
          if (lines[i].trim()) {
            bodyLines.push(lines[i]);
          }
          i++;
        }

        const body = bodyLines.join('\n');
        const fullMessage = body ? `${subject}\n\n${body}` : subject;

        let filesChanged = 0;
        let linesAdded = 0;
        let linesRemoved = 0;

        // Parse numstat lines (file stats) until next commit or end
        while (i < lines.length && !lines[i].includes('|')) {
          const statLine = lines[i].trim();

          if (!statLine) {
            i++;
            continue;
          }

          // numstat format: added\tremoved\tfilename
          const [added, removed] = statLine.split('\t');

          if (added !== '-' && removed !== '-') {
            linesAdded += parseInt(added || '0', 10);
            linesRemoved += parseInt(removed || '0', 10);
            filesChanged++;
          }

          i++;
        }

        commits.push({
          hash,
          author,
          date,
          message: subject,
          filesChanged,
          linesAdded,
          linesRemoved,
          coAuthors: this.extractCoAuthors(fullMessage),
        });
      } else {
        i++;
      }
    }

    return commits;
  }

  private extractCoAuthors(message: string): string[] | undefined {
    const coAuthorRegex = /Co-authored-by:\s*(.+?)\s*<(.+?)>/gi;
    const matches = Array.from(message.matchAll(coAuthorRegex));

    if (matches.length === 0) {
      return undefined;
    }

    return matches.map((match) => match[1].trim());
  }

  async getDiff(from: string = 'HEAD', to: string = ''): Promise<Diff> {
    const args = ['diff', '--numstat'];

    if (to) {
      args.push(`${from}..${to}`);
    } else {
      args.push(from);
    }

    const output = await executeGit(args.join(' '), this.repositoryPath);

    return this.parseDiff(output);
  }

  private parseDiff(output: string): Diff {
    const files: FileDiff[] = [];
    let totalLinesAdded = 0;
    let totalLinesRemoved = 0;

    if (!output) {
      return {
        files,
        totalLinesAdded,
        totalLinesRemoved,
        netChange: 0,
      };
    }

    const lines = output.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      // numstat format: added\tremoved\tfilename
      const parts = line.split('\t');

      if (parts.length < 3) continue;

      const [added, removed, path] = parts;

      // Binary files show as '-'
      if (added === '-' || removed === '-') {
        continue;
      }

      const linesAdded = parseInt(added, 10);
      const linesRemoved = parseInt(removed, 10);

      totalLinesAdded += linesAdded;
      totalLinesRemoved += linesRemoved;

      files.push({
        path,
        linesAdded,
        linesRemoved,
        changeType: 'modified', // Simplified - could be enhanced with --name-status
      });
    }

    return {
      files,
      totalLinesAdded,
      totalLinesRemoved,
      netChange: totalLinesAdded - totalLinesRemoved,
    };
  }

  async getFileDiff(
    filePath: string,
    from: string = 'HEAD',
    to: string = '',
  ): Promise<FileDiff | null> {
    const args = ['diff', '--numstat'];

    if (to) {
      args.push(`${from}..${to}`);
    } else {
      args.push(from);
    }

    args.push('--', filePath);

    const output = await executeGit(args.join(' '), this.repositoryPath);

    if (!output) {
      return null;
    }

    const [added, removed, path] = output.split('\t');

    if (added === '-' || removed === '-') {
      return null; // Binary file
    }

    return {
      path,
      linesAdded: parseInt(added, 10),
      linesRemoved: parseInt(removed, 10),
      changeType: 'modified',
    };
  }

  async getBlame(filePath: string): Promise<BlameInfo[]> {
    // Format: hash|author|date|lineNumber|content
    const args = ['blame', '--line-porcelain', filePath];

    const output = await executeGit(args.join(' '), this.repositoryPath);

    if (!output) {
      return [];
    }

    return this.parseBlame(output);
  }

  private parseBlame(output: string): BlameInfo[] {
    const lines = output.split('\n');
    const blameInfo: BlameInfo[] = [];

    let currentHash = '';
    let currentAuthor = '';
    let currentDate = '';
    let lineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.match(/^[0-9a-f]{6,40}/i)) {
        // Start of new blame block
        const parts = line.split(' ');
        currentHash = parts[0];
        lineNumber = parseInt(parts[2], 10);
      } else if (line.startsWith('author ')) {
        currentAuthor = line.substring(7);
      } else if (line.startsWith('author-time ')) {
        const timestamp = parseInt(line.substring(12), 10);
        currentDate = new Date(timestamp * 1000).toISOString();
      } else if (line.startsWith('\t')) {
        // Content line
        const content = line.substring(1);

        blameInfo.push({
          lineNumber,
          commitHash: currentHash,
          author: currentAuthor,
          date: new Date(currentDate),
          content,
        });
      }
    }

    return blameInfo;
  }

  async getAuthors(options: CommitQueryOptions = {}): Promise<Author[]> {
    const args = ['shortlog', '-sne'];

    if (options.since) {
      args.push(`--since=${options.since}`);
    }

    if (options.until) {
      args.push(`--until=${options.until}`);
    }

    if (!options.includeMerges) {
      args.push('--no-merges');
    }

    if (options.filePath) {
      args.push('--', options.filePath);
    }

    const command = args.join(' ');
    const output = await executeGit(command, this.repositoryPath);

    if (!output) {
      return [];
    }

    return this.parseAuthors(output);
  }

  private parseAuthors(output: string): Author[] {
    const lines = output.split('\n').filter((l) => l.trim());
    const authors: Author[] = [];

    for (const line of lines) {
      // Format: "   123  Author Name <email@example.com>"
      const match = line.match(/^\s*(\d+)\s+(.+?)\s+<(.+?)>/);

      if (match) {
        const [, commits, name, email] = match;

        authors.push({
          name,
          email,
          commits: parseInt(commits, 10),
        });
      }
    }

    return authors;
  }

  async getFileHistory(
    filePath: string,
    options: CommitQueryOptions = {},
  ): Promise<GitCommit[]> {
    return this.getCommits({
      ...options,
      filePath,
    });
  }
}
