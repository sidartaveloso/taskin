/**
 * Configuration manager for Taskin
 * Handles loading, saving, and validating .taskin.json configuration
 */

import type {
  AutomationConfig,
  AutomationLevel,
  CommitAutomation,
  TaskinConfig,
} from '@opentask/taskin-types';
import { TaskinConfigSchema } from '@opentask/taskin-types';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

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
}

/**
 * Resolves automation behavior from level and optional granular settings
 */
export function getAutomationBehavior(
  level: AutomationLevel,
  commits?: CommitAutomation,
): AutomationBehavior {
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
      autoCommitStatusChange:
        commits.taskStatusChanges ?? behavior.autoCommitStatusChange,
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

  constructor(private projectRoot: string = process.cwd()) {
    this.configPath = join(projectRoot, '.taskin.json');
  }

  /**
   * Load configuration from .taskin.json
   * @throws Error if config file not found or invalid
   */
  loadConfig(): TaskinConfig {
    if (!existsSync(this.configPath)) {
      throw new Error(
        `Taskin configuration not found at ${this.configPath}.\nRun 'taskin init' to initialize.`,
      );
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
   */
  saveConfig(config: TaskinConfig): void {
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
      return config.automation ?? { level: 'assisted' };
    } catch {
      // If config doesn't exist or is invalid, return default
      return { level: 'assisted' };
    }
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
    return getAutomationBehavior(automation.level, automation.commits);
  }

  /**
   * Check if config file exists
   */
  exists(): boolean {
    return existsSync(this.configPath);
  }
}
