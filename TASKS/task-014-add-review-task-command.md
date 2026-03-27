# 🔍 Task 014 — Add review task command

Status: done  
Type: feat  
Assignee: Sidarta Veloso

## Description

Implement a new `taskin review` command that prepares a task for code review by executing configurable quality checks and git operations. This command sits between the development workflow (start/pause) and task completion (finish), enabling automated pre-review validation.

The review command allows developers to transition a task from `in-progress` to `in-review` status while automatically performing repository-specific quality checks such as merging latest changes, running linters, type checkers, formatters, and tests.

## Context

Currently, Taskin provides:

- `taskin start` - Changes status to `in-progress`, suggests git branch creation
- `taskin pause` - Saves WIP commits (with automation support)
- `taskin finish` - Changes status to `done`, suggests final commits

**Gap**: There's no intermediate step for code review preparation. Developers manually:

1. Merge latest changes from base branch (e.g., develop)
2. Run quality checks (lint, typecheck, format, tests)
3. Fix any issues
4. Mark task ready for review

## Proposed Solution

### New Status

Add `in-review` status to the task lifecycle:

```
pending → in-progress → in-review → done
    ↓          ↓            ↓
  blocked    blocked      blocked
    ↓          ↓            ↓
canceled   canceled     canceled
```

### Command Interface

```bash
# Basic usage
taskin review <task-id>

# Options
taskin review 014 --skip-checks    # Skip quality checks
taskin review 014 --skip-merge     # Skip git merge
taskin review 014 --no-sound       # Disable review sound
taskin review 014 --dry-run        # Show what would be executed
```

### Unified Hook System

**All commands** (start, pause, finish, review) support hooks with three phases:

- **pre**: Executed before the command logic
- **during**: Executed during the command execution (optional, command-specific)
- **post**: Executed after the command completes successfully

Configuration in `.taskin.json`:

```json
{
  "automation": {
    "level": "assisted"
  },
  "hookConfig": {
    "baseBranch": "develop",
    "continueOnError": false,
    "timeout": 300000
  },
  "hooks": {
    "finish": {
      "during": [
        "git add TASKS/task-{{taskId}}-*.md",
        "git commit -m 'docs(TASKS): task-{{taskId}} - mark as done'"
      ],
      "post": ["gh pr create --fill", "notify-send 'Task finished!'"],
      "pre": ["pnpm test", "pnpm lint"]
    },
    "pause": {
      "during": [
        "git add -A",
        "git commit -m 'WIP: task-{{taskId}} - {{taskTitle}}'"
      ],
      "post": ["echo 'Work saved'"],
      "pre": ["git status --porcelain"]
    },
    "review": {
      "during": [
        "pnpm lint",
        "pnpm typecheck",
        "pnpm format:check",
        "pnpm test"
      ],
      "post": ["echo '✓ All checks passed!'", "git push origin HEAD"],
      "pre": ["git fetch origin", "git merge origin/{{baseBranch}}"]
    },
    "start": {
      "during": ["echo 'Starting task...'"],
      "post": [
        "git checkout -b feat/task-{{taskId}}",
        "notify-send 'Task started'"
      ],
      "pre": ["git fetch origin", "git status --porcelain"]
    }
  },
  "project": {
    "name": "taskin",
    "tasksDir": "TASKS"
  },
  "version": "1.0"
}
```

### Language-Agnostic Design

The hook system makes review checks completely language-agnostic:

**Node.js/TypeScript project:**

```json
"hooks": {
  "review": ["pnpm lint", "pnpm typecheck", "pnpm test"]
}
```

**Python project:**

```json
"hooks": {
  "review": ["ruff check .", "mypy .", "pytest"]
}
```

**Go project:**

```json
"hooks": {
  "review": ["go fmt ./...", "go vet ./...", "go test ./..."]
}
```

**Java/Maven project:**

```json
"hooks": {
  "review": ["mvn verify", "mvn checkstyle:check"]
}
```

### Command Workflow (Generic Hook Flow)

All commands (start, pause, finish, review) follow this unified flow:

1. **Validate task state**
   - Check current status vs required status for command
   - Load task configuration and hooks

2. **Execute pre-hooks** (optional)
   - Run configured pre-command hooks
   - Stop if any hook fails (unless continueOnError)

3. **Execute command logic**
   - Change task status
   - Update metadata
   - Execute during-hooks if configured

4. **Execute post-hooks** (optional)
   - Run configured post-command hooks
   - Continue even if post-hooks fail (warnings only)

5. **Commit changes** (if automation enabled)
   - Auto-commit status change based on automation level
   - Respect user's automation preferences

6. **Output results**
   - Show hook execution summary
   - Display next steps
   - Suggest related commands

### Review Command Specifics

- **Required status**: `in-progress`
- **Target status**: `in-review`
- **Typical hooks**: merge base, lint, typecheck, tests

### Error Handling

- If any hook fails and `continueOnError: false`, stop execution
- Display which hook failed and its output
- Task status remains `in-progress`
- Suggest fixes based on error type

### Automation Levels

Respect existing automation configuration:

- **manual**: Show suggested commands, don't execute hooks
- **assisted**: Execute hooks, suggest git commits
- **autopilot**: Execute hooks, auto-commit status change

## Tasks (TDD Approach - Test First!)

### Phase 1: Interfaces & Types (Test-Driven)

- [ ] **Write interface tests first** (`hook-runner.test.ts`)
  - Test IHookRunner contract (like ITaskProvider, IMetricsManager)
  - Test hook execution with mocked execSync
  - Test timeout handling
  - Test error handling with continueOnError
  - Test template variable substitution

- [ ] **Define IHookRunner interface** (`@opentask/taskin-types`)

  ```ts
  export interface IHookRunner {
    executeHooks(
      hooks: string[],
      context: HookContext,
      options: HookOptions,
    ): Promise<HookResult[]>;
  }
  ```

- [ ] **Write HookContext and HookOptions type tests**
  - Validate taskId, taskTitle, baseBranch substitution
  - Test timeout, continueOnError, cwd options

- [ ] **Add HookConfig to TaskinConfigSchema**
  - Write schema validation tests
  - Test all commands (start, pause, finish, review)
  - Test pre/during/post phases

- [ ] **Add in-review status to TaskStatus enum**
  - Write status transition validation tests
  - Test valid transitions: in-progress → in-review
  - Test invalid transitions: pending → in-review

### Phase 2: HookRunner Implementation (Test-Driven)

- [ ] **Implement HookRunner class**
  - Make interface tests pass
  - Use real execSync (not mocked in implementation)
  - Implement timeout with AbortController
  - Handle errors per continueOnError flag

- [ ] **Add template variable substitution**
  - Replace {{taskId}}, {{taskTitle}}, {{baseBranch}}
  - Write substitution tests first
  - Support escaping for special characters

- [ ] **Capture and format output**
  - Test stdout/stderr capture
  - Test output truncation for long results
  - Format duration display

### Phase 3: ConfigManager Hook Support (Test-Driven)

- [ ] **Write ConfigManager.getHooks() tests**
  - Test loading hooks for each command
  - Test default empty hooks when not configured
  - Test validation of hook configuration

- [ ] **Implement getCommandHooks() method**
  - Load hooks for specific command
  - Return pre/during/post separately
  - Make tests pass

- [ ] **Add hook configuration validation**
  - Validate hook arrays (strings only)
  - Validate hookConfig options
  - Test error messages

### Phase 4: Review Command (Test-Driven)

- [ ] **Write review.test.ts (unit tests first)**
  - Test status validation (only from in-progress)
  - Mock TaskManager, HookRunner, ConfigManager
  - Test --skip-checks flag
  - Test --dry-run flag
  - Test error handling

- [ ] **Implement review.ts command**
  - Follow start/pause/finish patterns
  - Inject IHookRunner (dependency injection)
  - Make all unit tests pass

- [ ] **Add reviewTask() to TaskManager**
  - Write TaskManager.reviewTask() tests first
  - Test status transition: in-progress → in-review
  - Test validation (task not found, wrong status)
  - Implement to make tests pass

- [ ] **Add reviewTask() to ITaskManager interface**
  - Update interface contract
  - Update all implementations

### Phase 5: Hook Integration for Existing Commands (Test-Driven)

- [ ] **Write hook integration tests for start command**
  - Test pre/post hooks execution
  - Test with/without hooks configured
  - Test automation level interaction

- [ ] **Add hook support to start.ts**
  - Inject HookRunner
  - Execute pre-hooks before status change
  - Execute post-hooks after status change
  - Make tests pass

- [ ] **Write hook integration tests for pause command**
  - Similar to start tests

- [ ] **Add hook support to pause.ts**
  - Make tests pass

- [ ] **Write hook integration tests for finish command**
  - Similar pattern

- [ ] **Add hook support to finish.ts**
  - Make tests pass

### Phase 6: Git Operations (Test-Driven)

- [ ] **Write git-operations.test.ts**
  - Test fetchOrigin(), mergeBase(), checkConflicts()
  - Mock execSync in tests
  - Test conflict detection
  - Test error scenarios

- [ ] **Implement git-operations.ts**
  - Make all tests pass
  - Reuse @opentask/taskin-git-utils where possible
  - Add new operations as needed

- [ ] **Integration tests with real git repo**
  - Create temp git repo in tests
  - Test real merge scenarios
  - Test conflict handling

### Phase 7: CLI UI/UX (Test-Driven)

- [ ] **Write output formatter tests**
  - Test hook progress display
  - Test duration formatting
  - Test error formatting

- [ ] **Implement formatted output**
  - Progress indicators
  - Duration display
  - Summary of passed/failed
  - Make tests pass

- [ ] **Add review sound effect**
  - Add review.wav to sounds/
  - Test sound playing (can be disabled)
  - Follow pause.ts pattern

### Phase 8: Integration & E2E Tests

- [ ] **Write review.e2e.test.ts**
  - Create real task structure
  - Run full review workflow
  - Test with real hook execution
  - Test with real git operations

- [ ] **Test interaction with automation levels**
  - manual: show suggestions only
  - assisted: execute hooks, suggest commits
  - autopilot: execute everything

- [ ] **Test hook failure scenarios**
  - Lint fails → status unchanged
  - Tests fail → error displayed
  - Post-hook fails → warning only

### Phase 9: Documentation & Examples

- [ ] **Document IHookRunner interface**
  - Add JSDoc comments
  - Add usage examples
  - Document in ARCHITECTURE.md

- [ ] **Update CLI README with hook system**
  - Document unified hook system
  - Show examples for all commands
  - Language-specific examples

- [ ] **Create hook configuration guide**
  - Best practices
  - Common patterns
  - Troubleshooting

- [ ] **Update review command documentation**
  - Add to CLI docs
  - Usage examples
  - Configuration examples

### Phase 10: Dashboard Integration (Future)

- [ ] **Add review status indicator in UI**
  - Show in-review badge
  - Display in task list

- [ ] **Add "Request Review" button**
  - Trigger review command via WebSocket
  - Show hook execution progress

- [ ] **Display hook results in dashboard**
  - Show which checks passed/failed
  - Display hook output
  - Add retry functionality

## Technical Details

### File Structure

```
packages/types-ts/src/
├── taskin.schemas.ts
│   └── HookConfigSchema          # Add hook configuration schema
└── taskin.types.ts
    ├── IHookRunner                # New interface for hook execution
    ├── HookContext                # Context with task variables
    ├── HookOptions                # Hook execution options
    └── HookResult                 # Hook execution result

packages/cli/src/
├── commands/
│   ├── review.ts                  # New review command (TDD)
│   ├── review.test.ts             # Unit tests (write first!)
│   ├── start.ts                   # Update with hook support
│   ├── pause.ts                   # Update with hook support
│   ├── finish.ts                  # Update with hook support
│   └── index.ts                   # Export review command
├── lib/
│   ├── hook-runner.ts             # IHookRunner implementation
│   ├── hook-runner.test.ts        # Unit tests (write first!)
│   ├── hook-runner.mock.ts        # Mock for testing
│   ├── config-manager.ts          # Update with getCommandHooks()
│   ├── git-operations.ts          # Git merge/conflict helpers
│   └── git-operations.test.ts     # Unit tests
└── sounds/
    └── review.wav                 # Review sound effect

packages/task-manager/src/
├── task-manager.ts
│   └── reviewTask()               # New method
├── task-manager.test.ts
│   └── describe('reviewTask')     # Tests (write first!)
└── task-manager.types.ts
    └── ITaskManager.reviewTask()  # Add to interface
```

### Core Interfaces (Test-Driven)

````typescript
// packages/types-ts/src/taskin.types.ts

/**
 * Context passed to hook execution with task-specific variables.
 * Variables can be used in hook commands with {{variableName}} syntax.
 *
 * @example
 * ```ts
 * const context: HookContext = {
 *   taskId: '014',
 *   taskTitle: 'Add review command',
 *   baseBranch: 'develop'
 * };
 * // Hook: "git checkout -b feat/task-{{taskId}}"
 * // Executes: "git checkout -b feat/task-014"
 * ```
 */
export interface HookContext {
  /** Task ID (normalized, e.g., '014') */
  taskId: string;

  /** Task title for commit messages */
  taskTitle: string;

  /** Base branch for merge operations */
  baseBranch?: string;

  /** Additional custom variables */
  [key: string]: string | undefined;
}

/**
 * Options for hook execution.
 */
export interface HookOptions {
  /** Timeout in milliseconds (default: 300000 = 5min) */
  timeout: number;

  /** Continue executing remaining hooks if one fails */
  continueOnError: boolean;

  /** Working directory for command execution */
  cwd: string;
}

/**
 * Result of a single hook execution.
 */
export interface HookResult {
  /** The hook command that was executed */
  hook: string;

  /** Whether the hook succeeded */
  success: boolean;

  /** Combined stdout/stderr output */
  output?: string;

  /** Error message if failed */
  error?: string;

  /** Execution duration in milliseconds */
  duration: number;
}

/**
 * Interface for executing lifecycle hooks.
 *
 * Follows the same provider pattern as ITaskProvider and IMetricsManager.
 * Enables testing with mocks and dependency injection.
 *
 * @example
 * ```ts
 * const hookRunner: IHookRunner = new HookRunner();
 * const results = await hookRunner.executeHooks(
 *   ['pnpm lint', 'pnpm test'],
 *   { taskId: '014', taskTitle: 'Add review' },
 *   { timeout: 60000, continueOnError: false, cwd: process.cwd() }
 * );
 * ```
 */
export interface IHookRunner {
  /**
   * Execute a list of hooks sequentially.
   * @param hooks - Array of shell commands to execute
   * @param context - Context with variables for template substitution
   * @param options - Execution options (timeout, error handling)
   * @returns Array of results for each executed hook
   */
  executeHooks(
    hooks: string[],
    context: HookContext,
    options: HookOptions,
  ): Promise<HookResult[]>;
}

/**
 * Hook configuration for a single command phase.
 */
export interface CommandHooks {
  /** Hooks executed before command logic */
  pre?: string[];

  /** Hooks executed during command logic */
  during?: string[];

  /** Hooks executed after command succeeds */
  post?: string[];
}

/**
 * Global hook configuration for all commands.
 */
export interface HookConfig {
  /** Hooks for start command */
  start?: CommandHooks;

  /** Hooks for pause command */
  pause?: CommandHooks;

  /** Hooks for finish command */
  finish?: CommandHooks;

  /** Hooks for review command */
  review?: CommandHooks;
}

/**
 * Global hook execution settings.
 */
export interface HookSettings {
  /** Continue on error (default: false) */
  continueOnError?: boolean;

  /** Timeout in milliseconds (default: 300000) */
  timeout?: number;

  /** Base branch for git operations (default: 'main') */
  baseBranch?: string;

  /** Working directory (default: project root) */
  cwd?: string;
}

/**
 * Taskin configuration with hooks.
 */
export interface TaskinConfig {
  version: string;
  project: ProjectConfig;
  automation?: AutomationConfig;
  hooks?: HookConfig; // New: unified hook system
  hookConfig?: HookSettings; // New: global hook settings
}
````

### HookRunner Implementation (TDD)

**IMPORTANT**: Write tests FIRST before implementing!

```typescript
// packages/cli/src/lib/hook-runner.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { HookRunner } from './hook-runner';
import { execSync } from 'child_process';

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
        .mockReturnValueOnce('output1')
        .mockReturnValueOnce('output2');

      const results = await hookRunner.executeHooks(
        ['echo test1', 'echo test2'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should substitute template variables', async () => {
      mockedExecSync.mockReturnValue('ok');

      await hookRunner.executeHooks(
        ['git checkout -b feat/task-{{taskId}}'],
        { taskId: '014', taskTitle: 'Test Task' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(execSync).toHaveBeenCalledWith(
        'git checkout -b feat/task-014',
        expect.any(Object),
      );
    });

    it('should stop on error when continueOnError is false', async () => {
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('failed');
        })
        .mockReturnValue('ok');

      const results = await hookRunner.executeHooks(
        ['failing-command', 'should-not-run'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(execSync).toHaveBeenCalledTimes(1);
    });

    it('should continue on error when continueOnError is true', async () => {
      mockedExecSync
        .mockImplementationOnce(() => {
          throw new Error('failed');
        })
        .mockReturnValue('ok');

      const results = await hookRunner.executeHooks(
        ['failing-command', 'should-run'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: true, cwd: '.' },
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });

    it('should measure execution duration', async () => {
      mockedExecSync.mockReturnValue('ok');

      const results = await hookRunner.executeHooks(
        ['echo test'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 5000, continueOnError: false, cwd: '.' },
      );

      expect(results[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle timeout', async () => {
      mockedExecSync.mockImplementation(() => {
        // Simulate long-running command
        const start = Date.now();
        while (Date.now() - start < 10000) {
          /* wait */
        }
      });

      const results = await hookRunner.executeHooks(
        ['long-command'],
        { taskId: '014', taskTitle: 'Test' },
        { timeout: 100, continueOnError: false, cwd: '.' },
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('timeout');
    });
  });
});
```

```typescript
// packages/cli/src/lib/hook-runner.ts
import { execSync } from 'child_process';
import type {
  IHookRunner,
  HookContext,
  HookOptions,
  HookResult,
} from '@opentask/taskin-types';

/**
 * Implementation of IHookRunner.
 * Executes shell commands with template variable substitution.
 */
export class HookRunner implements IHookRunner {
  async executeHooks(
    hooks: string[],
    context: HookContext,
    options: HookOptions,
  ): Promise<HookResult[]> {
    const results: HookResult[] = [];

    for (const hook of hooks) {
      const startTime = Date.now();
      const command = this.substituteVariables(hook, context);

      try {
        const output = this.execWithTimeout(command, options);

        results.push({
          hook,
          success: true,
          output: output.toString().trim(),
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          hook,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        });

        if (!options.continueOnError) {
          break;
        }
      }
    }

    return results;
  }

  private substituteVariables(hook: string, context: HookContext): string {
    let result = hook;

    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    return result;
  }

  private execWithTimeout(command: string, options: HookOptions): Buffer {
    return execSync(command, {
      cwd: options.cwd,
      timeout: options.timeout,
      encoding: 'buffer',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }
}
```

## Example Output

### Review Command with Hooks

```bash
$ taskin review 014

╭─────────────────────────────────────────────────╮
│  🔍 Reviewing Task 014                          │
╰─────────────────────────────────────────────────╯

ℹ Found task: Add review task command
ℹ Current status: in-progress

⏳ Executing pre-review hooks...
  ✓ git fetch origin (2.1s)
  ✓ git merge origin/develop (0.8s)

⏳ Executing review hooks...
  ✓ pnpm lint (8.2s)
  ✓ pnpm typecheck (12.5s)
  ✓ pnpm format:check (3.1s)
  ✓ pnpm test (45.3s)

⏳ Executing post-review hooks...
  ✓ echo '✓ All checks passed!' (0.1s)
  ✓ git push origin HEAD (1.2s)

✓ All checks passed! (73.3s total)
✓ Task 014 status changed to: in-review
✓ Auto-committed status change

Next steps:
  1. Request reviewers: gh pr edit --add-reviewer @team
  2. Link related issues in PR description
  3. Monitor CI/CD pipeline

PR template found at: .github/pull_request_template.md
```

### Start Command with Hooks

```bash
$ taskin start 015

╭─────────────────────────────────────────────────╮
│  🚀 Starting Task 015                           │
╰─────────────────────────────────────────────────╯

ℹ Found task: Implement user settings
ℹ Current status: pending

⏳ Executing pre-start hooks...
  ✓ git fetch origin (1.8s)
  ✓ git status --porcelain (0.1s)

✓ Task 015 status changed to: in-progress

⏳ Executing post-start hooks...
  ✓ git checkout -b feat/task-015 (0.2s)
  ✓ echo 'Started task 015: Implement user settings' (0.1s)

✓ Task started successfully! (2.2s total)

Next steps:
  1. Start coding! 💻
  2. Use "taskin pause" to save progress
  3. Use "taskin review" when ready for review
```

### Finish Command with Hooks

```bash
$ taskin finish 015

╭─────────────────────────────────────────────────╮
│  ✅ Finishing Task 015                          │
╰─────────────────────────────────────────────────╯

ℹ Found task: Implement user settings
ℹ Current status: in-review

⏳ Executing pre-finish hooks...
  ✓ pnpm lint (7.8s)
  ✓ pnpm typecheck (11.2s)
  ✓ pnpm test:unit (38.5s)

✓ Task 015 status changed to: done

⏳ Executing post-finish hooks...
  ✓ gh pr create --fill --draft (2.1s)
  ✓ echo 'Task 015 finished!' (0.1s)

✓ Task completed! 🎉 (59.7s total)

PR created: https://github.com/org/repo/pull/42
```

### Hook Failure Example

```bash
$ taskin review 016

╭─────────────────────────────────────────────────╮
│  🔍 Reviewing Task 016                          │
╰─────────────────────────────────────────────────╯

ℹ Found task: Fix authentication bug
ℹ Current status: in-progress

⏳ Executing pre-review hooks...
  ✓ git fetch origin (2.0s)
  ✓ git merge origin/develop (0.9s)

⏳ Executing review hooks...
  ✓ pnpm lint (8.1s)
  ✗ pnpm typecheck (3.2s)
    Error: Type 'string' is not assignable to type 'number'
    src/auth.ts:42:5

✗ Review failed!

Task status remains: in-progress

Fix the errors above and try again.

Tip: Run 'pnpm typecheck' to see full error details
```

## Configuration Examples

### Minimal Configuration (Only Review)

```json
{
  "hooks": {
    "review": {
      "during": ["npm test"]
    }
  },
  "project": {
    "name": "my-project",
    "tasksDir": "TASKS"
  },
  "version": "1.0"
}
```

### Advanced Configuration (All Commands with Hooks)

```json
{
  "automation": {
    "level": "assisted"
  },
  "hookConfig": {
    "baseBranch": "develop",
    "continueOnError": false,
    "cwd": ".",
    "timeout": 600000
  },
  "hooks": {
    "finish": {
      "during": [
        "git add TASKS/task-{{taskId}}-*.md",
        "git commit -m 'docs(TASKS): task-{{taskId}} - mark as done [skip-ci]'"
      ],
      "post": [
        "gh pr create --fill --draft",
        "echo 'Task {{taskId}} finished!'"
      ],
      "pre": ["pnpm lint", "pnpm typecheck", "pnpm test:unit"]
    },
    "pause": {
      "during": [
        "git add -A",
        "git commit -m 'WIP: task-{{taskId}} - {{taskTitle}}'"
      ],
      "post": ["echo 'Work saved for task {{taskId}}'"],
      "pre": ["git status --porcelain"]
    },
    "review": {
      "during": [
        "pnpm lint:check",
        "pnpm format:check",
        "pnpm typecheck",
        "pnpm test:unit",
        "pnpm test:integration",
        "pnpm build"
      ],
      "post": [
        "pnpm task-linter lint",
        "node scripts/update-metrics.js",
        "git push origin HEAD",
        "gh pr ready"
      ],
      "pre": ["git fetch origin", "git merge origin/{{baseBranch}} --no-edit"]
    },
    "start": {
      "post": [
        "git checkout -b feat/task-{{taskId}}",
        "echo 'Started task {{taskId}}: {{taskTitle}}'"
      ],
      "pre": ["git fetch origin", "git status --porcelain"]
    }
  },
  "project": {
    "name": "taskin",
    "tasksDir": "TASKS"
  },
  "version": "1.0"
}
```

### Python Project Example

```json
{
  "hookConfig": {
    "baseBranch": "main"
  },
  "hooks": {
    "finish": {
      "post": ["gh pr create"],
      "pre": ["pytest"]
    },
    "review": {
      "during": [
        "ruff check .",
        "mypy .",
        "pytest --cov=src",
        "black . --check"
      ],
      "pre": ["git merge origin/main"]
    },
    "start": {
      "post": ["git checkout -b feature/task-{{taskId}}"]
    }
  },
  "project": {
    "name": "python-api",
    "tasksDir": "TASKS"
  },
  "version": "1.0"
}
```

### Go Project Example

```json
{
  "hooks": {
    "review": {
      "during": [
        "go fmt ./...",
        "go vet ./...",
        "golangci-lint run",
        "go test -v ./..."
      ]
    }
  }
}
```

### Java/Maven Project Example

```json
{
  "hooks": {
    "review": {
      "during": ["mvn verify", "mvn checkstyle:check", "mvn pmd:check"]
    }
  }
}
```

## Related Commands

This completes the task lifecycle management with unified hook support:

```bash
# Full lifecycle with hooks
taskin start 014      # pending → in-progress
                     # Executes: pre-start → status change → post-start hooks
                     # Example: fetch, checkout branch, notify

taskin pause 014      # Save WIP while in-progress
                     # Executes: pre-pause → status update → during-pause → post-pause
                     # Example: check status, commit WIP, notify

taskin review 014     # in-progress → in-review (NEW)
                     # Executes: pre-review → quality checks → post-review
                     # Example: merge base, lint, test, push

taskin finish 014     # in-review → done
                     # Executes: pre-finish → status change → post-finish
                     # Example: final tests, commit, create PR
```

### Hook Phases for Each Command

| Command    | Pre-hooks               | During-hooks          | Post-hooks            |
| ---------- | ----------------------- | --------------------- | --------------------- |
| **start**  | Git fetch, status check | Status change         | Create branch, notify |
| **pause**  | Status check            | Commit WIP            | Save state, notify    |
| **finish** | Final tests             | Mark as done, commit  | Create PR, notify     |
| **review** | Merge base              | Lint, typecheck, test | Push, mark ready      |

### Typical Workflow

```bash
# Developer starts task
taskin start 015
# → Hooks: fetch origin, create branch feat/task-015

# Developer works on code...
# Developer saves progress
taskin pause 015
# → Hooks: commit WIP with automated message

# Developer continues work...
# Developer requests review
taskin review 015
# → Hooks: merge develop, run all quality checks, push

# After review approval
taskin finish 015
# → Hooks: run final tests, create PR, mark done
```

## Benefits

1. **Unified Hook System**: Same hook architecture for all commands (start, pause, finish, review)
2. **Test-Driven**: Interfaces tested first, implementation follows pass-first approach
3. **Provider Pattern**: IHookRunner follows ITaskProvider and IMetricsManager patterns
4. **Consistency**: Same quality checks run for all tasks
5. **Automation**: Reduces manual steps through configurable hooks
6. **Catch Issues Early**: Find problems before reviewer time
7. **Language-Agnostic**: Works with any tech stack via shell commands
8. **Configurable**: Teams define their quality standards in `.taskin.json`
9. **Git Safety**: Pre-hooks can ensure branch is up-to-date
10. **Clear Workflow**: Explicit `in-review` status completes the lifecycle
    11**TDD Required**: Write tests BEFORE implementation for all components

- **Interface-Based**: All components implement interfaces (IHookRunner, ITaskProvider, etc.)
- **Real Implementation Tests**: Test real classes implementing interfaces, not just mocks
- Unified hook system works for all commands (start, pause, finish, review)
- Hooks are optional - minimum config just changes status
- Failed hooks prevent status change (unless continueOnError)
- Post-hooks continue even on failure (warnings only)
- Template variables: {{taskId}}, {{taskTitle}}, {{baseBranch}}
- Git merge conflicts handled gracefully with suggestions
- Compatible with GitHub CLI, GitLab CLI, etc. in hooks
- Can integrate with external quality tools (SonarQube, CodeClimate)
- Sound effects play on command success (can be disabled)
- Review command respects existing automation levels
- Hooks executed sequentially in order defined
- Each hook has separate timeout (cumulative from global timeout)

### TDD Philosophy

This implementation follows strict TDD:

1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass test
3. **Refactor**: Clean up while keeping tests green

Always test through interfaces, not concrete implementations directly.

- Failed hooks prevent status change (unless continueOnError)
- Git merge conflicts are handled gracefully with suggestions
- Compatible with GitHub CLI, GitLab CLI, etc. in hooks
- Can integrate with external quality tools (SonarQube, CodeClimate)
- Sound effect plays on successful review (can be disabled)
