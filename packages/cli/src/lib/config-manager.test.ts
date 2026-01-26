import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ConfigManager,
  getAutomationBehavior,
  type AutomationBehavior,
} from './config-manager';

describe('ConfigManager', () => {
  const testDir = join(process.cwd(), '.test-config-manager');
  const configPath = join(testDir, '.taskin.json');

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should load valid config file', () => {
      const config = {
        version: '1.0.3',
        automation: {
          level: 'assisted' as const,
        },
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      const manager = new ConfigManager(testDir);
      const loaded = manager.loadConfig();

      expect(loaded).toEqual(config);
    });

    it('should throw error if config file does not exist', () => {
      const manager = new ConfigManager(testDir);

      expect(() => manager.loadConfig()).toThrow('not found');
    });

    it('should throw error if config is invalid', () => {
      const invalidConfig = {
        version: '1.0.3',
        automation: {
          level: 'invalid-level', // Invalid level
        },
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(
        configPath,
        JSON.stringify(invalidConfig, null, 2),
        'utf-8',
      );

      const manager = new ConfigManager(testDir);

      expect(() => manager.loadConfig()).toThrow();
    });

    it('should work with config without automation section', () => {
      const config = {
        version: '1.0.3',
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      const manager = new ConfigManager(testDir);
      const loaded = manager.loadConfig();

      expect(loaded.automation).toBeUndefined();
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const config = {
        version: '1.0.3',
        automation: {
          level: 'autopilot' as const,
        },
        provider: {
          type: 'fs',
          config: {},
        },
      };

      const manager = new ConfigManager(testDir);
      manager.saveConfig(config);

      expect(existsSync(configPath)).toBe(true);

      const loaded = manager.loadConfig();
      expect(loaded).toEqual(config);
    });
  });

  describe('getAutomationLevel', () => {
    it('should return automation level from config', () => {
      const config = {
        version: '1.0.3',
        automation: {
          level: 'manual' as const,
        },
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      const manager = new ConfigManager(testDir);
      const level = manager.getAutomationLevel();

      expect(level).toBe('manual');
    });

    it('should return "assisted" as default if no automation config', () => {
      const config = {
        version: '1.0.3',
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      const manager = new ConfigManager(testDir);
      const level = manager.getAutomationLevel();

      expect(level).toBe('assisted');
    });
  });

  describe('setAutomationLevel', () => {
    it('should update automation level in config', () => {
      const config = {
        version: '1.0.3',
        automation: {
          level: 'assisted' as const,
        },
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      const manager = new ConfigManager(testDir);
      manager.setAutomationLevel('autopilot');

      const updated = manager.loadConfig();
      expect(updated.automation?.level).toBe('autopilot');
    });

    it('should create automation section if not exists', () => {
      const config = {
        version: '1.0.3',
        provider: {
          type: 'fs',
          config: {},
        },
      };

      writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

      const manager = new ConfigManager(testDir);
      manager.setAutomationLevel('manual');

      const updated = manager.loadConfig();
      expect(updated.automation?.level).toBe('manual');
    });
  });
});

describe('getAutomationBehavior', () => {
  it('should return correct behavior for "manual" level', () => {
    const behavior: AutomationBehavior = getAutomationBehavior('manual');

    expect(behavior.autoCommitStatusChange).toBe(false);
    expect(behavior.autoCommitPause).toBe(false);
    expect(behavior.autoCommitFinish).toBe(false);
  });

  it('should return correct behavior for "assisted" level', () => {
    const behavior: AutomationBehavior = getAutomationBehavior('assisted');

    expect(behavior.autoCommitStatusChange).toBe(true);
    expect(behavior.autoCommitPause).toBe(true);
    expect(behavior.autoCommitFinish).toBe(false);
  });

  it('should return correct behavior for "autopilot" level', () => {
    const behavior: AutomationBehavior = getAutomationBehavior('autopilot');

    expect(behavior.autoCommitStatusChange).toBe(true);
    expect(behavior.autoCommitPause).toBe(true);
    expect(behavior.autoCommitFinish).toBe(true);
  });

  it('should allow granular overrides', () => {
    const behavior: AutomationBehavior = getAutomationBehavior('assisted', {
      taskStatusChanges: false,
      workInProgress: true,
      completedWork: false,
    });

    expect(behavior.autoCommitStatusChange).toBe(false);
    expect(behavior.autoCommitPause).toBe(true);
    expect(behavior.autoCommitFinish).toBe(false);
  });

  it('should respect granular settings over level', () => {
    const behavior: AutomationBehavior = getAutomationBehavior('manual', {
      taskStatusChanges: true,
      workInProgress: false,
      completedWork: true,
    });

    expect(behavior.autoCommitStatusChange).toBe(true);
    expect(behavior.autoCommitPause).toBe(false);
    expect(behavior.autoCommitFinish).toBe(true);
  });
});
