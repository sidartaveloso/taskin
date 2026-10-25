import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigManager } from '../config-manager.js';
import { isLabsFeature, labsRefusal, requireLabs } from './labs.js';

let raiz: string;

const escrever = (extra: Record<string, unknown> = {}) =>
  writeFileSync(
    path.join(raiz, '.taskin.json'),
    JSON.stringify({ version: '1.0.3', provider: { type: 'fs', config: {} }, ...extra }, null, 2),
  );

const lido = () => JSON.parse(readFileSync(path.join(raiz, '.taskin.json'), 'utf-8')) as { labs?: string[] };

beforeEach(() => {
  raiz = mkdtempSync(path.join(tmpdir(), 'taskin-labs-'));
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(raiz, { recursive: true, force: true });
});

describe('ConfigManager — labs', () => {
  it('has nothing on when .taskin.json has no labs', () => {
    escrever();
    expect(new ConfigManager(raiz).getLabs()).toEqual([]);
    expect(new ConfigManager(raiz).isLabsEnabled('estimate')).toBe(false);
  });

  it('reads the features a project turned on, and sets apart the ones it does not know', () => {
    escrever({ labs: ['estimate', 'from-a-newer-taskin'] });
    const config = new ConfigManager(raiz);
    expect(config.getLabs()).toEqual(['estimate']);
    expect(config.getUnknownLabs()).toEqual(['from-a-newer-taskin']);
  });

  it('turns a feature on and off, keeping what it does not know', () => {
    escrever({ labs: ['from-a-newer-taskin'] });
    const config = new ConfigManager(raiz);

    config.setLabs('estimate', true);
    expect(lido().labs).toEqual(['from-a-newer-taskin', 'estimate']);
    config.setLabs('estimate', true);
    expect(lido().labs).toEqual(['from-a-newer-taskin', 'estimate']);

    config.setLabs('estimate', false);
    expect(lido().labs).toEqual(['from-a-newer-taskin']);
  });

  it('drops the labs key when the last feature goes off', () => {
    escrever({ labs: ['estimate'] });
    new ConfigManager(raiz).setLabs('estimate', false);
    expect(lido()).not.toHaveProperty('labs');
  });

  it('turns nothing on when the config is missing or broken', () => {
    expect(new ConfigManager(raiz).getLabs()).toEqual([]);
    writeFileSync(path.join(raiz, '.taskin.json'), '{ quebrado');
    expect(new ConfigManager(raiz).isLabsEnabled('estimate')).toBe(false);
  });
});

describe('requireLabs', () => {
  it('lets a feature that is on through', () => {
    escrever({ labs: ['estimate'] });
    const saida = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    requireLabs('estimate', raiz);
    expect(saida).not.toHaveBeenCalled();
  });

  it('exits with the way to turn it on when it is off', () => {
    escrever();
    const saida = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const erros = vi.spyOn(console, 'error');
    requireLabs('estimate', raiz);
    expect(saida).toHaveBeenCalledWith(1);
    expect(erros.mock.calls.flat().join('\n')).toContain('taskin config --labs estimate');
  });
});

describe('labs names', () => {
  it('knows estimate, and nothing else yet', () => {
    expect(isLabsFeature('estimate')).toBe(true);
    expect(isLabsFeature('estimativa')).toBe(false);
  });

  it('says it is beta, and how to turn it on', () => {
    expect(labsRefusal('estimate')).toBe(
      'taskin estimate is a labs feature: it is beta, and off until this project turns it on. Enable it with `taskin config --labs estimate`.',
    );
  });
});
