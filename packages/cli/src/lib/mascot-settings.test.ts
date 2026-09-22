import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigManager } from './config-manager.js';

const temporarios: string[] = [];

function projeto(config: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), 'taskin-mascote-'));
  temporarios.push(dir);
  writeFileSync(join(dir, '.taskin.json'), JSON.stringify(config), 'utf-8');
  return dir;
}

afterEach(() => {
  for (const d of temporarios.splice(0)) rmSync(d, { recursive: true, force: true });
});

const base = { version: '1.0.3', provider: { type: 'fs', config: { tasksDir: 'TASKS' } } };

/**
 * A ponte que faltava entre o `.taskin.json` e o mascote.
 *
 * O schema da reacao ao ruido ja existia, e `resolveMascotNoiseSettings` ja
 * sabia aplicar os padroes — mas o `ConfigManager` nao lia o bloco, entao
 * nenhuma superficie conseguia chegar ate ele. A configuracao existia no papel
 * e nao no produto.
 */
describe('ConfigManager.getMascotNoiseSettings', () => {
  it('um projeto que nao opina fica com a reacao desligada', () => {
    const c = new ConfigManager(projeto(base));

    expect(c.getMascotNoiseSettings().enabled).toBe(false);
  });

  it('le o bloco quando ele existe', () => {
    const c = new ConfigManager(projeto({ ...base, mascot: { reactions: { noise: { enabled: true } } } }));

    expect(c.getMascotNoiseSettings().enabled).toBe(true);
  });

  it('aplica os padroes ao que o projeto nao disse', () => {
    const c = new ConfigManager(projeto({ ...base, mascot: { reactions: { noise: { enabled: true } } } }));

    const s = c.getMascotNoiseSettings();

    expect(s.threshold).toBeGreaterThan(0);
    expect(s.debounceMs).toBeGreaterThan(0);
  });

  it('respeita o que o projeto ajustou', () => {
    const c = new ConfigManager(
      projeto({ ...base, mascot: { reactions: { noise: { enabled: true, threshold: 0.9 } } } }),
    );

    expect(c.getMascotNoiseSettings().threshold).toBe(0.9);
  });

  /*
   * Um `.taskin.json` que alguem editou a mao pode ter qualquer coisa ali. O
   * mascote nao e motivo para o CLI parar de funcionar.
   */
  it('bloco invalido nao derruba o comando: cai no padrao', () => {
    const c = new ConfigManager(projeto({ ...base, mascot: { reactions: { noise: { threshold: 'alto' } } } }));

    expect(c.getMascotNoiseSettings().enabled).toBe(false);
  });
});
