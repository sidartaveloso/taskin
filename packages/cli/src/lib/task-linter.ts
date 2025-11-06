import chalk from 'chalk';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export interface ValidationError {
  file: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
}

export interface TaskMetadata {
  assignee?: string;
  status?: string;
  type?: string;
}

export interface LintResult {
  errors: ValidationError[];
  filesChecked: number;
  valid: boolean;
  warnings: ValidationError[];
}

const VALID_STATUSES = ['pending', 'in-progress', 'done', 'blocked'];
const VALID_TYPES = ['feat', 'fix', 'chore', 'docs', 'refactor', 'test'];

export class TaskLinter {
  private errors: ValidationError[] = [];

  private addError(
    file: string,
    message: string,
    severity: 'error' | 'warning' = 'error',
    line?: number,
  ): void {
    this.errors.push({ file, message, severity, line });
  }

  private validateFilename(filename: string): boolean {
    const pattern = /^task-\d{2,3}-[a-z0-9-]+\.md$/;
    return pattern.test(filename);
  }

  private extractMetadata(content: string): TaskMetadata {
    const headerSection = content.split(/^##/m)[0];
    const statusMatch = headerSection.match(/^Status:\s*(.+)$/im);
    const typeMatch = headerSection.match(/^Type:\s*(.+)$/im);
    const assigneeMatch = headerSection.match(/^Assignee:\s*(.+)$/im);

    return {
      status: statusMatch?.[1]?.trim().toLowerCase(),
      type: typeMatch?.[1]?.trim().toLowerCase(),
      assignee: assigneeMatch?.[1]?.trim(),
    };
  }

  private validateContent(filename: string, content: string): void {
    const lines = content.split('\n');

    // Check H1 heading
    if (!lines[0]?.trim().startsWith('# ')) {
      this.addError(
        filename,
        'Task file must start with a level 1 heading (# Task NNN — Title)',
        'error',
        1,
      );
    }

    const h1Pattern = /^#\s+(?:🧩\s+)?Task\s+\d{2,3}\s+[—-]\s+.+$/i;
    if (lines[0] && !h1Pattern.test(lines[0])) {
      this.addError(
        filename,
        'H1 heading must follow format: "# Task NNN — Title"',
        'error',
        1,
      );
    }

    const metadata = this.extractMetadata(content);

    if (!metadata.status) {
      this.addError(filename, 'Missing required metadata: Status', 'error');
    } else if (!VALID_STATUSES.includes(metadata.status)) {
      this.addError(
        filename,
        `Invalid status "${metadata.status}". Valid: ${VALID_STATUSES.join(', ')}`,
        'error',
      );
    }

    if (!metadata.type) {
      this.addError(filename, 'Missing required metadata: Type', 'error');
    } else if (!VALID_TYPES.includes(metadata.type)) {
      this.addError(
        filename,
        `Invalid type "${metadata.type}". Valid: ${VALID_TYPES.join(', ')}`,
        'error',
      );
    }

    if (!metadata.assignee) {
      this.addError(
        filename,
        'Missing recommended metadata: Assignee',
        'warning',
      );
    }

    const h2Sections = content.match(/^##\s+.+$/gm);
    if (!h2Sections || h2Sections.length === 0) {
      this.addError(
        filename,
        'Task should have at least one section (## heading)',
        'warning',
      );
    }

    const firstH2Index = content.indexOf('\n##');
    if (firstH2Index > -1) {
      const afterH2 = content.substring(firstH2Index);
      if (
        afterH2.match(/^Status:/im) ||
        afterH2.match(/^Type:/im) ||
        afterH2.match(/^Assignee:/im)
      ) {
        this.addError(
          filename,
          'Metadata must be placed BEFORE the first ## section',
          'error',
        );
      }
    }
  }

  async lint(tasksDir: string): Promise<LintResult> {
    this.errors = [];

    try {
      const files = await readdir(tasksDir);
      const taskFiles = files.filter((f) => f.endsWith('.md'));

      for (const file of taskFiles) {
        if (!this.validateFilename(file)) {
          this.addError(
            file,
            'Invalid filename. Expected: task-NNN-kebab-case-title.md',
            'error',
          );
        }

        const content = await readFile(join(tasksDir, file), 'utf-8');
        this.validateContent(file, content);
      }

      const errors = this.errors.filter((e) => e.severity === 'error');
      const warnings = this.errors.filter((e) => e.severity === 'warning');

      return {
        errors,
        warnings,
        filesChecked: taskFiles.length,
        valid: errors.length === 0,
      };
    } catch (error) {
      throw new Error(`Failed to lint tasks: ${error}`);
    }
  }

  static printResults(result: LintResult): void {
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(
        chalk.green(`✅ All ${result.filesChecked} task files are valid!\n`),
      );
      return;
    }

    console.log(
      chalk.bold(
        `\n📊 Validation Results (${result.filesChecked} files checked):\n`,
      ),
    );

    const errorsByFile = new Map<string, ValidationError[]>();
    [...result.errors, ...result.warnings].forEach((error) => {
      if (!errorsByFile.has(error.file)) {
        errorsByFile.set(error.file, []);
      }
      errorsByFile.get(error.file)!.push(error);
    });

    for (const [file, fileErrors] of errorsByFile) {
      console.log(chalk.cyan(`\n📄 ${file}`));
      for (const error of fileErrors) {
        const icon =
          error.severity === 'error' ? chalk.red('❌') : chalk.yellow('⚠️');
        const location = error.line ? `:${error.line}` : '';
        console.log(`  ${icon} ${error.message}${location}`);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(
      chalk.bold(
        `\n📊 Summary: ${chalk.red(result.errors.length + ' error(s)')}, ${chalk.yellow(result.warnings.length + ' warning(s)')}\n`,
      ),
    );
  }
}
