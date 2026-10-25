/**
 * `taskin config` e a defaultBranch — task-204.
 *
 * No autopilot a `defaultBranch` tem que estar configurada: ela e o quadro de
 * status compartilhado (task-135). Escolher autopilot detecta a branch
 * (develop, senao main, senao master), grava e diz o que escolheu; o menu
 * interativo pergunta com a detectada como sugestao.
 */

import { execFileSync } from 'child_process';
import { Command } from 'commander';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManager } from '../lib/config-manager.js';
import { configCommand } from './config.js';

vi.mock('../lib/project-check.js', () => ({
  requireTaskinProject: vi.fn(),
}));

const prompt = vi.hoisted(() => vi.fn());
vi.mock('inquirer', () => ({
  default: { prompt },
}));

const testDir = join(process.cwd(), '.test-config-default-branch');
const configPath = join(testDir, '.taskin.json');

const git = (...args: string[]): void => {
  execFileSync('git', args, { cwd: testDir, stdio: 'pipe' });
};

/** Repositorio proprio dentro do testDir, com as branches pedidas. */
function initRepo(initial: string, ...extras: string[]): void {
  git('init', '-q', '-b', initial);
  git('config', 'user.email', 'test@taskin.dev');
  git('config', 'user.name', 'Taskin Test');
  writeFileSync(join(testDir, 'README.md'), '# repo\n');
  git('add', 'README.md');
  git('commit', '-q', '-m', 'inicio');
  for (const branch of extras) git('branch', branch);
}

function writeConfig(automation: Record<string, unknown>): void {
  writeFileSync(
    configPath,
    JSON.stringify({ version: '1.0.13', automation, provider: { type: 'fs', config: {} } }, null, 2),
    'utf-8',
  );
}

const savedAutomation = (): Record<string, unknown> => JSON.parse(readFileSync(configPath, 'utf-8')).automation;

const runConfig = async (...args: string[]): Promise<void> => {
  const program = new Command();
  program.exitOverride();
  configCommand(program);
  await program.parseAsync(['node', 'taskin', 'config', ...args]);
};

describe('taskin config e a defaultBranch', () => {
  let logged: string[];

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    prompt.mockReset();
    vi.spyOn(process, 'cwd').mockReturnValue(testDir);

    logged = [];
    vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
      logged.push(parts.map(String).join(' '));
    });
    vi.spyOn(console, 'error').mockImplementation((...parts: unknown[]) => {
      logged.push(parts.map(String).join(' '));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  describe('--level autopilot', () => {
    it('detecta, grava e diz qual defaultBranch escolheu', async () => {
      initRepo('main', 'develop');
      writeConfig({ level: 'assisted' });

      await runConfig('--level', 'autopilot');

      expect(savedAutomation()).toMatchObject({ level: 'autopilot', defaultBranch: 'develop' });
      expect(logged.join('\n')).toContain('develop');
    });

    it('cai em main quando nao ha develop', async () => {
      initRepo('main');
      writeConfig({ level: 'manual' });

      await runConfig('--level', 'autopilot');

      expect(savedAutomation().defaultBranch).toBe('main');
    });

    it('nao sobrescreve uma defaultBranch que ja esta configurada', async () => {
      initRepo('main', 'develop');
      writeConfig({ level: 'assisted', defaultBranch: 'tasks' });

      await runConfig('--level', 'autopilot');

      expect(savedAutomation().defaultBranch).toBe('tasks');
    });

    it('sem develop, main nem master nao adivinha: avisa e aponta a flag', async () => {
      initRepo('trunk');
      writeConfig({ level: 'assisted' });

      await runConfig('--level', 'autopilot');

      expect(savedAutomation().level).toBe('autopilot');
      expect(savedAutomation().defaultBranch).toBeUndefined();
      expect(logged.join('\n')).toContain('--default-branch');
    });

    it.each(['manual', 'assisted'])('em %s nao preenche a defaultBranch sozinho', async (level) => {
      initRepo('main', 'develop');
      writeConfig({ level: level === 'manual' ? 'assisted' : 'manual' });

      await runConfig('--level', level);

      expect(savedAutomation().defaultBranch).toBeUndefined();
    });
  });

  describe('--default-branch', () => {
    it('grava a branch e preserva o resto do bloco de automation', async () => {
      initRepo('main');
      writeConfig({ level: 'autopilot', autoSync: true, ciSkipTag: '[ci skip]' });

      await runConfig('--default-branch', 'tasks');

      expect(savedAutomation()).toMatchObject({
        level: 'autopilot',
        autoSync: true,
        ciSkipTag: '[ci skip]',
        defaultBranch: 'tasks',
      });
    });

    it('aparece no --show', async () => {
      initRepo('main');
      writeConfig({ level: 'autopilot', defaultBranch: 'develop' });

      await runConfig('--show');

      expect(logged.join('\n')).toMatch(/Default branch.*develop/);
    });

    it('o --show diz que nao esta configurada quando falta', async () => {
      initRepo('main');
      writeConfig({ level: 'assisted' });

      await runConfig('--show');

      expect(logged.join('\n')).toMatch(/Default branch.*not set/i);
    });
  });

  describe('menu interativo', () => {
    const escolheAutomation = { section: 'automation' };

    it('ao escolher autopilot pergunta a defaultBranch sugerindo a detectada', async () => {
      initRepo('main', 'develop');
      writeConfig({ level: 'assisted' });
      prompt
        .mockResolvedValueOnce(escolheAutomation)
        .mockResolvedValueOnce({ level: 'autopilot' })
        .mockResolvedValueOnce({ defaultBranch: 'develop' });

      await runConfig();

      const pergunta = prompt.mock.calls[2]?.[0]?.[0];
      expect(pergunta?.name).toBe('defaultBranch');
      expect(pergunta?.default).toBe('develop');
      expect(savedAutomation()).toMatchObject({ level: 'autopilot', defaultBranch: 'develop' });
    });

    it('grava a branch que a pessoa digitou no lugar da sugerida', async () => {
      initRepo('main', 'develop');
      writeConfig({ level: 'assisted' });
      prompt
        .mockResolvedValueOnce(escolheAutomation)
        .mockResolvedValueOnce({ level: 'autopilot' })
        .mockResolvedValueOnce({ defaultBranch: 'tasks' });

      await runConfig();

      expect(savedAutomation().defaultBranch).toBe('tasks');
    });

    it('nao pergunta a defaultBranch fora do autopilot', async () => {
      initRepo('main', 'develop');
      writeConfig({ level: 'autopilot', defaultBranch: 'develop' });
      prompt.mockResolvedValueOnce(escolheAutomation).mockResolvedValueOnce({ level: 'assisted' });

      await runConfig();

      expect(prompt).toHaveBeenCalledTimes(2);
    });

    it('sem candidata detectada pergunta sem sugestao', async () => {
      initRepo('trunk');
      writeConfig({ level: 'assisted' });
      prompt
        .mockResolvedValueOnce(escolheAutomation)
        .mockResolvedValueOnce({ level: 'autopilot' })
        .mockResolvedValueOnce({ defaultBranch: 'trunk' });

      await runConfig();

      expect(prompt.mock.calls[2]?.[0]?.[0]?.default).toBeUndefined();
      expect(savedAutomation().defaultBranch).toBe('trunk');
    });
  });
});

describe('ConfigManager em autopilot sem defaultBranch', () => {
  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it('usa a deteccao em memoria, sem gravar no arquivo', () => {
    initRepo('main', 'develop');
    writeConfig({ level: 'autopilot' });

    expect(new ConfigManager(testDir).getAutomationBehavior().defaultBranch).toBe('develop');
    expect(savedAutomation().defaultBranch).toBeUndefined();
  });

  it('a defaultBranch configurada vence a detectada', () => {
    initRepo('main', 'develop');
    writeConfig({ level: 'autopilot', defaultBranch: 'tasks' });

    expect(new ConfigManager(testDir).getAutomationBehavior().defaultBranch).toBe('tasks');
  });

  it('fora do autopilot nao detecta nada', () => {
    initRepo('main', 'develop');
    writeConfig({ level: 'assisted' });

    expect(new ConfigManager(testDir).getAutomationBehavior().defaultBranch).toBeUndefined();
  });

  it('setDefaultBranch grava e preserva o resto do bloco', () => {
    writeConfig({ level: 'autopilot', autoSync: true });

    new ConfigManager(testDir).setDefaultBranch('tasks');

    expect(savedAutomation()).toMatchObject({ level: 'autopilot', autoSync: true, defaultBranch: 'tasks' });
  });
});
