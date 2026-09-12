import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectPackageManager, mcpCommandFor } from './package-manager.js';

let raiz: string;

const escrever = (nome: string, conteudo = '') => writeFileSync(join(raiz, nome), conteudo, 'utf-8');

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-pm-'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Qual gerenciador o projeto usa, e como invocar o taskin por ele.
 *
 * O detector anterior fazia `existsSync('pnpm-lock.yaml')` **relativo ao cwd**:
 * rodando de um subdiretorio nao achava lockfile nenhum e devolvia `npm` em
 * silencio — o `.mcp.json` sairia com o comando errado. Este recebe o
 * diretorio, e quem o chama passa a raiz do projeto.
 */
describe('detectPackageManager', () => {
  it('acredita no campo `packageManager` antes do lockfile', () => {
    escrever('package.json', JSON.stringify({ packageManager: 'yarn@4.9.1' }));
    escrever('pnpm-lock.yaml');

    expect(detectPackageManager(raiz)).toBe('yarn');
  });

  it.each([
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
    ['bun.lockb', 'bun'],
  ])('reconhece %s como %s', (lockfile, esperado) => {
    escrever(lockfile);

    expect(detectPackageManager(raiz)).toBe(esperado);
  });

  it('cai em npm quando nao ha pista nenhuma', () => {
    expect(detectPackageManager(raiz)).toBe('npm');
  });

  it('nao quebra com package.json malformado — segue para o lockfile', () => {
    escrever('package.json', '{ isto nao e json');
    escrever('pnpm-lock.yaml');

    expect(detectPackageManager(raiz)).toBe('pnpm');
  });
});

/**
 * A invocacao muda por gerenciador, e errar aqui gera um `.mcp.json` que o
 * agente nao consegue executar.
 */
describe('mcpCommandFor', () => {
  it.each([
    ['pnpm', 'pnpm', ['exec', 'taskin', 'mcp-server']],
    ['yarn', 'yarn', ['taskin', 'mcp-server']],
    ['npm', 'npx', ['taskin', 'mcp-server']],
    ['bun', 'bunx', ['taskin', 'mcp-server']],
  ] as const)('%s invoca via %s', (manager, command, args) => {
    expect(mcpCommandFor(manager)).toEqual({ command, args });
  });

  it('nunca devolve `pnpm taskin`, que so funciona no monorepo do taskin', () => {
    const { command, args } = mcpCommandFor('pnpm');

    expect([command, ...args].join(' ')).not.toBe('pnpm taskin mcp-server');
  });
});
