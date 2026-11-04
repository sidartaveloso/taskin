import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** O `.gitattributes` deste repositorio, o mesmo que vai versionado. */
const ATRIBUTOS = resolve(process.cwd(), '../../.gitattributes');
const linha = (id: string) => `${JSON.stringify({ id, repository: 'r', task: '1', tokens: 1 })}\n`;

let raiz: string;
const git = (...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@example.com', ...args], {
    cwd: raiz,
    stdio: 'pipe',
    encoding: 'utf8',
  });
const runs = () => join(raiz, '.taskin', 'runs.jsonl');
const acrescentar = (id: string) => writeFileSync(runs(), readFileSync(runs(), 'utf8') + linha(id));

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-merge-'));
  git('init', '-q', '-b', 'principal');
  mkdirSync(join(raiz, '.taskin'));
  writeFileSync(runs(), linha('comum'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

describe('o merge do runs.jsonl', { timeout: 30_000 }, () => {
  it('duas maquinas acrescentando no fim do arquivo mesclam sem conflito, com as duas linhas', () => {
    copyFileSync(ATRIBUTOS, join(raiz, '.gitattributes'));
    git('add', '-A');
    git('commit', '-qm', 'base');
    git('switch', '-qc', 'outra-maquina');
    acrescentar('dela');
    git('commit', '-qam', 'dela');
    git('switch', '-q', 'principal');
    acrescentar('minha');
    git('commit', '-qam', 'minha');

    git('merge', '-q', '--no-edit', 'outra-maquina');

    const escrito = readFileSync(runs(), 'utf8');
    expect(escrito).not.toContain('<<<<');
    for (const id of ['comum', 'dela', 'minha']) expect(escrito).toContain(`"id":"${id}"`);
  });

  it('o .gitattributes nao declara mais nada sobre outros arquivos', () => {
    expect(readFileSync(ATRIBUTOS, 'utf8').trim()).toBe('.taskin/runs.jsonl merge=union');
  });
});
