import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

/* Cada teste sobe o CLI varias vezes; os 5s padrao estouram em paralelo. */
const LENTO = { timeout: 30_000 };

let raiz: string;

const tarefa = (id: string, extra = '') => `# 🧩 Task ${id} — Tarefa ${id}

- Status: pending
- Type: feat
- Assignee: Alguem${extra}

## Description
Existe para ficar num grupo dentro de outro.

## Tasks
- [ ] Nada

## Notes
Nada.
`;

/** Sai com o codigo e as duas saidas, sem estourar quando o comando recusa. */
async function rodar(...args: string[]): Promise<{ code: number; stdout: string; saida: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], { cwd: raiz });
    return { code: 0, stdout, saida: stdout + stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', saida: `${falha.stdout ?? ''}${falha.stderr ?? ''}` };
  }
}

/** O pai de cada grupo, como ficou gravado no registro. */
const pais = (): Record<string, string | undefined> => {
  const { groups } = JSON.parse(readFileSync(join(raiz, '.taskin', '.taskin-groups.json'), 'utf-8')) as {
    groups: Record<string, { parentId?: string }>;
  };
  return Object.fromEntries(Object.entries(groups).map(([id, g]) => [id, g.parentId]));
};

beforeEach(async () => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-group-nest-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'manual', autoSync: false },
    }),
    'utf-8',
  );
  writeFileSync(join(raiz, 'TASKS', 'task-001-tarefa-001.md'), tarefa('001', '\n- Priority: 100'), 'utf-8');
  writeFileSync(join(raiz, 'TASKS', 'task-002-tarefa-002.md'), tarefa('002', '\n- Priority: 200'), 'utf-8');
  await rodar('group', 'create', 'Pai', '--id', 'g-pai');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Grupo dentro de grupo pelo binario de verdade (task-119), gravando no
 * registro do provider de arquivos.
 */
describe('taskin group create --parent / nest / unnest', LENTO, () => {
  it('create --parent grava o pai, e group list indenta o subgrupo abaixo dele', async () => {
    const criar = await rodar('group', 'create', 'Sub', '--id', 'g-sub', '--parent', 'g-pai');

    expect(criar.code, criar.saida).toBe(0);
    expect(criar.saida).toContain('inside g-pai');
    expect(pais()['g-sub']).toBe('g-pai');

    const linhas = (await rodar('group', 'list')).stdout.split('\n');
    const pai = linhas.findIndex((l) => l.includes('g-pai'));
    expect(linhas[pai]).toMatch(/^ {2}\S*g-pai/);
    expect(linhas[pai + 1]).toMatch(/^ {4}\S*g-sub/);
  });

  it('nest e unnest movem o grupo, e o ciclo recusa com saida 1', async () => {
    await rodar('group', 'create', 'Sub', '--id', 'g-sub');

    expect((await rodar('group', 'nest', 'g-sub', 'g-pai')).code).toBe(0);
    expect(pais()['g-sub']).toBe('g-pai');

    const ciclo = await rodar('group', 'nest', 'g-pai', 'g-sub');
    expect(ciclo.code).toBe(1);
    expect(pais()['g-pai']).toBeUndefined();

    expect((await rodar('group', 'unnest', 'g-sub')).code).toBe(0);
    expect(pais()['g-sub']).toBeUndefined();
  });

  it('list --json aninha o subgrupo, e o texto o indenta sob o pai', async () => {
    await rodar('group', 'create', 'Sub', '--id', 'g-sub', '--parent', 'g-pai');
    await rodar('group', 'join', '001', 'g-pai');
    await rodar('group', 'join', '002', 'g-sub');

    const { code, stdout, saida } = await rodar('list', '--json');
    expect(code, saida).toBe(0);
    const [pai] = JSON.parse(stdout);
    expect(pai.group.id).toBe('g-pai');
    expect(pai.tasks.map((t: { id: string }) => t.id)).toEqual(['001']);
    expect(pai.groups[0].group).toMatchObject({ id: 'g-sub', parentId: 'g-pai' });
    expect(pai.groups[0].tasks.map((t: { id: string }) => t.id)).toEqual(['002']);

    const texto = (await rodar('list')).stdout.split('\n');
    expect(texto.find((l) => l.includes('(g-sub)'))).toMatch(/^ {2}\S*▸ Sub/);
    expect(texto.find((l) => l.includes('Tarefa 002'))).toMatch(/^ {4}\S*002/);
  });
});
