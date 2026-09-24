import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

/* Cada teste sobe o CLI; os 5s padrao estouram com a suite inteira em paralelo. */
const LENTO = { timeout: 30_000 };

let raiz: string;

const tarefa = (id: string, status: string) => `# 🧩 Task ${id} — Tarefa ${id}

- Status: ${status}
- Type: feat
- Assignee: Alguem

## Description
Existe para ser listada.

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

/** Os ids da saida `--json`, que agrupa as tarefas por grupo. */
async function ids(...args: string[]): Promise<string[]> {
  const { code, stdout, saida } = await rodar('list', '--json', ...args);
  expect(code, saida).toBe(0);
  const lista = JSON.parse(stdout) as Array<{ id?: string; tasks?: Array<{ id: string }> }>;
  return lista.flatMap((item) => (item.tasks ? item.tasks.map((t) => t.id) : item.id ? [item.id] : [])).sort();
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-list-default-'));
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
  const tarefas: Array<[string, string]> = [
    ['001', 'pending'],
    ['002', 'in-progress'],
    ['003', 'done'],
    ['004', 'canceled'],
  ];
  for (const [id, status] of tarefas) {
    writeFileSync(join(raiz, 'TASKS', `task-${id}-tarefa-${id}.md`), tarefa(id, status), 'utf-8');
  }
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * O padrao da listagem sao as abertas (task-116), provado pelo binario de
 * verdade sobre arquivos reais — e nao por um mock do `TaskManager`.
 */
describe('taskin list --json, pelo binario', LENTO, () => {
  it('sem criterio, devolve so as abertas', async () => {
    expect(await ids()).toEqual(['001', '002']);
  });

  it('--all devolve todas, fechadas inclusive', async () => {
    expect(await ids('--all')).toEqual(['001', '002', '003', '004']);
  });

  it('--closed, --active e --status trocam o padrao em vez de intersectar com ele', async () => {
    expect(await ids('--closed')).toEqual(['003', '004']);
    expect(await ids('--active')).toEqual(['002']);
    expect(await ids('--status', 'done')).toEqual(['003']);
  });

  it('--open continua aceito e da o mesmo que o padrao', async () => {
    expect(await ids('--open')).toEqual(await ids());
  });

  it('o texto segue o mesmo padrao do --json', async () => {
    const { saida } = await rodar('list');
    expect(saida).toMatch(/\b001\b/);
    expect(saida).not.toMatch(/\b003\b/);
  });

  it.each([['--open'], ['--closed'], ['--active'], ['--status', 'done']])(
    'recusa --all com %s, sai com 1 e diz por que',
    async (...recorte) => {
      const { code, saida } = await rodar('list', '--json', '--all', ...recorte);
      expect(code).toBe(1);
      expect(saida).toMatch(/`all` cannot be combined with/);
    },
  );
});
