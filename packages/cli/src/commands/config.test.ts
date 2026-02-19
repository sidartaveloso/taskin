/**
 * Tests for config command
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManager } from '../lib/config-manager.js';

// Mock modules
vi.mock('../lib/project-check.js', () => ({
  requireTaskinProject: vi.fn(),
}));

vi.mock('../lib/colors.js', () => ({
  colors: {
    highlight: (text: string) => text,
    normal: (text: string) => text,
    secondary: (text: string) => text,
    warning: (text: string) => text,
  },
  error: vi.fn(),
  info: vi.fn(),
  printHeader: vi.fn(),
  success: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe('ConfigManager integration for config command', () => {
  const testDir = join(process.cwd(), '.test-config-command');
  const configPath = join(testDir, '.taskin.json');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create a valid config file
    const config = {
      version: '1.0.13',
      automation: {
        level: 'assisted' as const,
      },
      provider: {
        type: 'fs',
        config: {},
      },
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  describe('setAutomationLevel', () => {
    it('should set automation level to manual', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('manual');

      const level = manager.getAutomationLevel();
      expect(level).toBe('manual');
    });

    it('should set automation level to assisted', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('assisted');

      const level = manager.getAutomationLevel();
      expect(level).toBe('assisted');
    });

    it('should set automation level to autopilot', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('autopilot');

      const level = manager.getAutomationLevel();
      expect(level).toBe('autopilot');
    });

    it('should preserve other config properties when changing level', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('autopilot');

      const config = manager.loadConfig();
      expect(config.version).toBe('1.0.13');
      expect(config.provider.type).toBe('fs');
      expect(config.automation?.level).toBe('autopilot');
    });
  });

  describe('getAutomationBehavior', () => {
    it('should return correct behavior for manual level', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('manual');
      const behavior = manager.getAutomationBehavior();

      expect(behavior.autoCommitStatusChange).toBe(false);
      expect(behavior.autoCommitPause).toBe(false);
      expect(behavior.autoCommitFinish).toBe(false);
    });

    it('should return correct behavior for assisted level', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('assisted');
      const behavior = manager.getAutomationBehavior();

      expect(behavior.autoCommitStatusChange).toBe(true);
      expect(behavior.autoCommitPause).toBe(true);
      expect(behavior.autoCommitFinish).toBe(false);
    });

    it('should return correct behavior for autopilot level', () => {
      const manager = new ConfigManager(testDir);

      manager.setAutomationLevel('autopilot');
      const behavior = manager.getAutomationBehavior();

      expect(behavior.autoCommitStatusChange).toBe(true);
      expect(behavior.autoCommitPause).toBe(true);
      expect(behavior.autoCommitFinish).toBe(true);
    });
  });

  describe('showConfiguration', () => {
    it('should load current configuration without errors', () => {
      const manager = new ConfigManager(testDir);

      const config = manager.loadConfig();
      const level = manager.getAutomationLevel();
      const behavior = manager.getAutomationBehavior();

      expect(config).toBeDefined();
      expect(level).toBe('assisted');
      expect(behavior).toBeDefined();
      expect(behavior.autoCommitStatusChange).toBe(true);
      expect(behavior.autoCommitPause).toBe(true);
      expect(behavior.autoCommitFinish).toBe(false);
    });
  });

  describe('validation', () => {
    it('should reject invalid automation levels', () => {
      const manager = new ConfigManager(testDir);

      // TypeScript should prevent this, but test runtime validation
      expect(() => {
        const config = manager.loadConfig();
        config.automation = { level: 'invalid' as any };
        manager.saveConfig(config);
      }).toThrow();
    });

    it('should accept all valid automation levels', () => {
      const manager = new ConfigManager(testDir);
      const validLevels = ['manual', 'assisted', 'autopilot'] as const;

      for (const level of validLevels) {
        expect(() => {
          manager.setAutomationLevel(level);
        }).not.toThrow();

        const currentLevel = manager.getAutomationLevel();
        expect(currentLevel).toBe(level);
      }
    });
  });
});
