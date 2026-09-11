/**
 * Configuration manager for Taskin
 * Handles loading, saving, and validating .taskin.json configuration
 */

import { DEFAULT_CI_SKIP_TAG } from '@opentask/taskin-git-utils';
import type {
  AutomationConfig,
  AutomationLevel,
  CommandHooks,
  CommitAutomation,
  HookSettings,
  NotificationConfig,
  TaskinConfig,
  TaskinConfigInput,
} from '@opentask/taskin-types';
import { TaskinConfigSchema } from '@opentask/taskin-types';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * The automation block a project gets when `.taskin.json` declares none.
 */
const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  level: 'assisted',
  autoSync: true,
  ciSkipTag: DEFAULT_CI_SKIP_TAG,
};

/**
 * Automation behavior resolved from config
 */
export interface AutomationBehavior {
  /** Auto-commit task status changes (start command) */
  autoCommitStatusChange: boolean;
  /** Auto-commit work in progress (pause command) */
  autoCommitPause: boolean;
  /** Auto-commit completed work (finish command) */
  autoCommitFinish: boolean;
  /** Default branch for autocommits */
  defaultBranch?: string;
  /** Enable automatic fetch/rebase/push before creating tasks and after status changes */
  autoSync?: boolean;
  /** Target branch for squash commits when a task is marked as done */
  originBranch?: string;
  /** Tag appended to the commits Taskin writes on its own. Empty means none. */
  ciSkipTag?: string;
}

/**
 * Resolves automation behavior from level and optional granular settings
 */
export function getAutomationBehavior(level: AutomationLevel, commits?: CommitAutomation): AutomationBehavior {
  // Define preset behaviors for each level
  const presets: Record<AutomationLevel, AutomationBehavior> = {
    manual: {
      autoCommitStatusChange: false,
      autoCommitPause: false,
      autoCommitFinish: false,
    },
    assisted: {
      autoCommitStatusChange: true,
      autoCommitPause: true,
      autoCommitFinish: false,
    },
    autopilot: {
      autoCommitStatusChange: true,
      autoCommitPause: true,
      autoCommitFinish: true,
    },
  };

  const behavior = presets[level];

  // Apply granular overrides if provided
  if (commits) {
    return {
      autoCommitStatusChange: commits.taskStatusChanges ?? behavior.autoCommitStatusChange,
      autoCommitPause: commits.workInProgress ?? behavior.autoCommitPause,
      autoCommitFinish: commits.completedWork ?? behavior.autoCommitFinish,
    };
  }

  return behavior;
}

/**
 * Configuration manager for Taskin
 */
export class ConfigManager {
  private configPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.configPath = join(projectRoot, '.taskin.json');
  }

  /**
   * Load configuration from .taskin.json
   * @throws Error if config file not found or invalid
   */
  loadConfig(): TaskinConfig {
    if (!existsSync(this.configPath)) {
      throw new Error(`Taskin configuration not found at ${this.configPath}.\nRun 'taskin init' to initialize.`);
    }

    const content = readFileSync(this.configPath, 'utf-8');
    const json: unknown = JSON.parse(content);

    // Validate with Zod schema
    const result = TaskinConfigSchema.safeParse(json);

    if (!result.success) {
      throw new Error(`Invalid Taskin configuration:\n${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Save configuration to .taskin.json
   *
   * Takes the *input* shape: the schema fills in what it has defaults for, so
   * a caller need not spell out `automation.ciSkipTag` to save a config.
   */
  saveConfig(config: TaskinConfigInput): void {
    // Validate before saving
    const validated = TaskinConfigSchema.parse(config);

    writeFileSync(this.configPath, JSON.stringify(validated, null, 2), 'utf-8');
  }

  /**
   * Get automation level from config
   * Returns 'assisted' as default if not configured or if config loading fails
   */
  getAutomationLevel(): AutomationLevel {
    try {
      const config = this.loadConfig();
      return config.automation?.level ?? 'assisted';
    } catch {
      // If config doesn't exist or is invalid, return default
      return 'assisted';
    }
  }

  /**
   * Set automation level in config
   */
  setAutomationLevel(level: AutomationLevel): void {
    const config = this.loadConfig();

    config.automation = {
      ...DEFAULT_AUTOMATION_CONFIG,
      ...config.automation,
      level,
    };

    this.saveConfig(config);
  }

  /**
   * Get automation configuration
   */
  getAutomationConfig(): AutomationConfig {
    try {
      const config = this.loadConfig();
      return config.automation ?? DEFAULT_AUTOMATION_CONFIG;
    } catch {
      // If config doesn't exist or is invalid, return default
      return DEFAULT_AUTOMATION_CONFIG;
    }
  }

  /**
   * Tag appended to the commits Taskin writes on its own, so a status change
   * does not trigger the project's pipeline.
   *
   * Returns `[skip ci]` when unconfigured. An empty string is a real answer —
   * it means the project wants CI to run — so it is returned as-is.
   */
  getCiSkipTag(): string {
    return this.getAutomationConfig().ciSkipTag ?? DEFAULT_CI_SKIP_TAG;
  }

  /**
   * Set the CI-skip tag, preserving the rest of the automation block.
   */
  setCiSkipTag(ciSkipTag: string): void {
    const config = this.loadConfig();

    config.automation = {
      ...DEFAULT_AUTOMATION_CONFIG,
      ...config.automation,
      ciSkipTag,
    };

    this.saveConfig(config);
  }

  /**
   * Set automation configuration
   */
  setAutomationConfig(automation: AutomationConfig): void {
    const config = this.loadConfig();
    config.automation = automation;
    this.saveConfig(config);
  }

  /**
   * Get resolved automation behavior
   */
  getAutomationBehavior(): AutomationBehavior {
    const automation = this.getAutomationConfig();
    return {
      ...getAutomationBehavior(automation.level, automation.commits),
      defaultBranch: automation.defaultBranch,
      autoSync: automation.autoSync,
      originBranch: automation.originBranch,
      ciSkipTag: automation.ciSkipTag ?? DEFAULT_CI_SKIP_TAG,
    };
  }

  /**
   * Check if config file exists
   */
  exists(): boolean {
    return existsSync(this.configPath);
  }

  /**
   * Get hooks for a specific command.
   * Returns empty object if hooks are not configured.
   *
   * @param command - Command name ('start', 'pause', 'finish', 'review')
   * @returns Command hooks configuration
   */
  getCommandHooks(command: 'start' | 'pause' | 'finish' | 'review'): CommandHooks {
    try {
      const config = this.loadConfig();
      return config.hooks?.[command] ?? {};
    } catch {
      // If config doesn't exist or is invalid, return empty hooks
      return {};
    }
  }

  /**
   * Get global hook settings.
   * Returns defaults if not configured.
   *
   * @returns Global hook settings
   */
  getHookSettings(): HookSettings {
    try {
      const config = this.loadConfig();
      return {
        baseBranch: config.hookConfig?.baseBranch ?? 'main',
        continueOnError: config.hookConfig?.continueOnError ?? false,
        timeout: config.hookConfig?.timeout ?? 300000,
        cwd: config.hookConfig?.cwd,
      };
    } catch {
      // If config doesn't exist or is invalid, return defaults
      return {
        baseBranch: 'main',
        continueOnError: false,
        timeout: 300000,
      };
    }
  }

  /**
   * Get notification configuration.
   * Returns undefined if notifications are not configured.
   */
  getNotifications(): NotificationConfig | undefined {
    try {
      const config = this.loadConfig();
      return config.notifications;
    } catch {
      return undefined;
    }
  }

  /**
   * Set notification configuration.
   */
  setNotifications(notifications: NotificationConfig): void {
    const config = this.loadConfig();
    config.notifications = notifications;
    this.saveConfig(config);
  }
}
