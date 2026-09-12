import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveInvocation } from './resolve-invocation.js';

let raiz: string;

const escrever = (nome: string, conteudo = '') => {
  const caminho = join(raiz, nome);
  mkdirSync(join(caminho, '..'), { recursive: true });
  writeFileSync(caminho, conteudo, 'utf-8');
};

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-invoke-'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Como alcancar o taskin **deste** projeto.
 *
 * A primeira versao assumia que ele sempre e dependencia e emitia
 * `pnpm exec taskin mcp-server`. No proprio monorepo do taskin isso esta
 * errado: ali `taskin` nao e dependencia, e um script — nao ha
 * `node_modules/.bin/taskin`, e `pnpm exec` cai num taskin **global**, de
 * outra versao. A sonda pegou na primeira execucao real: o servidor respondeu
 * com duas ferramentas em vez de tres, porque era um 3.0.3 instalado
 * globalmente.
 */
describe('resolveInvocation', () => {
  it('usa o executor quando o binario esta em node_modules/.bin', () => {
    escrever('node_modules/.bin/taskin', '#!/bin/sh\n');

    expect(resolveInvocation(raiz, 'pnpm')).toEqual({
      command: 'pnpm',
      args: ['exec', 'taskin', 'mcp-server'],
    });
  });

  it('usa o script quando ha um `taskin` em scripts e nenhum binario', () => {
    escrever('package.json', JSON.stringify({ scripts: { taskin: 'tsx packages/cli/src/index.ts' } }));

    expect(resolveInvocation(raiz, 'pnpm')).toEqual({
      command: 'pnpm',
      args: ['taskin', 'mcp-server'],
    });
  });

  it('o binario vence o script, quando os dois existem', () => {
    escrever('node_modules/.bin/taskin', '#!/bin/sh\n');
    escrever('package.json', JSON.stringify({ scripts: { taskin: 'tsx algo.ts' } }));

    expect(resolveInvocation(raiz, 'pnpm').args[0]).toBe('exec');
  });

  it('npm chama script com `run`, e nao direto', () => {
    escrever('package.json', JSON.stringify({ scripts: { taskin: 'tsx algo.ts' } }));

    expect(resolveInvocation(raiz, 'npm')).toEqual({
      command: 'npm',
      args: ['run', 'taskin', '--', 'mcp-server'],
    });
  });

  it('sem binario e sem script, cai no executor — que e o caso de quem ainda vai instalar', () => {
    expect(resolveInvocation(raiz, 'npm')).toEqual({
      command: 'npx',
      args: ['taskin', 'mcp-server'],
    });
  });

  it('nao quebra com package.json malformado', () => {
    escrever('package.json', '{ isto nao e json');

    expect(resolveInvocation(raiz, 'yarn').command).toBe('yarn');
  });
});
