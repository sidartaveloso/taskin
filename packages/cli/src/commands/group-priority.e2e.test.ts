import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

/*
 * Cada teste sobe o CLI de tres a quatro vezes; os 5s padrao estouram quando a
 * suite inteira roda em paralelo.
 */
const LENTO = { timeout: 30_000 };

let raiz: string;

const tarefa = (id: string, extra = '') => `# 🧩 Task ${id} — Tarefa ${id}

- Status: pending
- Type: feat
- Assignee: Alguem${extra}

## Description
Existe para ser agrupada e priorizada.

## Tasks
- [ ] Nada

## Notes
Nada.
`;

/** Sai com o codigo e as duas saidas, sem estourar quando o comando recusa. */
async function rodar(...args: string[]): Promise<{ code: number; saida: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], { cwd: raiz });
    return { code: 0, saida: stdout + stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, saida: `${falha.stdout ?? ''}${falha.stderr ?? ''}` };
  }
}

const arquivo = (id: string) => {
  const nome = readdirSync(join(raiz, 'TASKS')).find((f) => f.startsWith(`task-${id}-`));
  if (!nome) throw new Error(`task-${id} nao encontrada`);
  return readFileSync(join(raiz, 'TASKS', nome), 'utf-8');
};

const campo = (id: string, rotulo: string) => arquivo(id).match(new RegExp(`^- ${rotulo}: (.+)$`, 'm'))?.[1];

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-group-priority-'));
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
  writeFileSync(join(raiz, 'TASKS', 'task-003-tarefa-003.md'), tarefa('003', '\n- Priority: 300'), 'utf-8');
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * Agrupar e priorizar sem editar o arquivo a mao (task-105).
 */
describe('taskin group join / leave', LENTO, () => {
  it('poe a tarefa num grupo que existe, e tira', async () => {
    await rodar('group', 'add', 'CLI', '--id', 'g-cli');

    const entrar = await rodar('group', 'join', '001', 'g-cli');
    expect(entrar.code).toBe(0);
    expect(campo('001', 'Group')).toBe('g-cli');

    const sair = await rodar('group', 'leave', '001');
    expect(sair.code).toBe(0);
    expect(campo('001', 'Group')).toBeUndefined();
  });

  it('recusa um grupo que nao existe, dizendo qual e onde ver os que existem', async () => {
    const { code, saida } = await rodar('group', 'join', '001', 'g-sumiu');

    expect(code).toBe(1);
    expect(saida).toContain('g-sumiu');
    expect(saida).toContain('taskin group list');
    expect(campo('001', 'Group')).toBeUndefined();
  });

  it('recusa uma tarefa que nao existe', async () => {
    await rodar('group', 'add', 'CLI', '--id', 'g-cli');

    const { code, saida } = await rodar('group', 'join', '999', 'g-cli');

    expect(code).toBe(1);
    expect(saida).toContain('999');
  });
});

/**
 * Mover um grupo inteiro pela CLI (task-117), o que antes so o dashboard fazia.
 */
describe('taskin group move', LENTO, () => {
  /* 001 solta, 002 e 003 no g-cli, 004 no g-outro. */
  beforeEach(async () => {
    writeFileSync(join(raiz, 'TASKS', 'task-004-tarefa-004.md'), tarefa('004', '\n- Priority: 400'), 'utf-8');
    await rodar('group', 'add', 'CLI', '--id', 'g-cli');
    await rodar('group', 'add', 'Outro', '--id', 'g-outro');
    await rodar('group', 'join', '002', 'g-cli');
    await rodar('group', 'join', '003', 'g-cli');
    await rodar('group', 'join', '004', 'g-outro');
  });

  const fila = () =>
    ['001', '002', '003', '004'].sort((a, b) => Number(campo(a, 'Priority')) - Number(campo(b, 'Priority')));

  it('--top leva o grupo inteiro a frente, e grava so os membros', async () => {
    const antes = { '001': arquivo('001'), '004': arquivo('004') };

    const { code, saida } = await rodar('group', 'move', 'g-cli', '--top');

    expect(code).toBe(0);
    expect(fila()).toEqual(['002', '003', '001', '004']);
    expect(arquivo('001')).toBe(antes['001']);
    expect(arquivo('004')).toBe(antes['004']);
    expect(saida).toContain('2 task file');
  });

  it('--bottom, --before e --after, com tarefa ou grupo como alvo', async () => {
    expect((await rodar('group', 'move', 'g-cli', '--bottom')).code).toBe(0);
    expect(fila()).toEqual(['001', '004', '002', '003']);

    expect((await rodar('group', 'move', 'g-cli', '--before', 'g-outro')).code).toBe(0);
    expect(fila()).toEqual(['001', '002', '003', '004']);

    expect((await rodar('group', 'move', 'g-cli', '--before', '001')).code).toBe(0);
    expect(fila()).toEqual(['002', '003', '001', '004']);

    expect((await rodar('group', 'move', 'g-outro', '--after', '001')).code).toBe(0);
    expect(fila()).toEqual(['002', '003', '001', '004']);
  });

  it('ja no lugar nao grava nada, e diz', async () => {
    const { code, saida } = await rodar('group', 'move', 'g-cli', '--after', '001');

    expect(code).toBe(0);
    expect(saida).toContain('already');
  });

  it('exige exatamente uma forma', async () => {
    const nenhuma = await rodar('group', 'move', 'g-cli');
    const duas = await rodar('group', 'move', 'g-cli', '--top', '--after', '001');

    for (const r of [nenhuma, duas]) {
      expect(r.code).toBe(1);
      expect(r.saida).toContain('exactly one');
    }
    expect(fila()).toEqual(['001', '002', '003', '004']);
  });

  it('recusa grupo inexistente, alvo inexistente e alvo membro do proprio grupo', async () => {
    const semGrupo = await rodar('group', 'move', 'g-sumiu', '--top');
    const semAlvo = await rodar('group', 'move', 'g-cli', '--before', '999');
    const membro = await rodar('group', 'move', 'g-cli', '--after', '003');

    expect(semGrupo.saida).toContain('g-sumiu');
    expect(semAlvo.saida).toContain('999');
    expect(membro.saida).toContain('member');
    for (const r of [semGrupo, semAlvo, membro]) expect(r.code).toBe(1);
    expect(fila()).toEqual(['001', '002', '003', '004']);
  });
});

describe('taskin priority', LENTO, () => {
  it('com numero, grava o numero naquela tarefa', async () => {
    const { code } = await rodar('priority', '003', '50');

    expect(code).toBe(0);
    expect(campo('003', 'Priority')).toBe('50');
  });

  it('com --before, poe a tarefa na frente da referencia e muda um arquivo so', async () => {
    const antes = { '001': arquivo('001'), '002': arquivo('002') };

    const { code, saida } = await rodar('priority', '003', '--before', '002');

    expect(code).toBe(0);
    const nova = Number(campo('003', 'Priority'));
    expect(nova).toBeGreaterThan(100);
    expect(nova).toBeLessThan(200);
    expect(arquivo('001')).toBe(antes['001']);
    expect(arquivo('002')).toBe(antes['002']);
    expect(saida).toContain('1 task file');
  });

  it('com --after, poe a tarefa atras da referencia', async () => {
    await rodar('priority', '001', '--after', '003');

    expect(Number(campo('001', 'Priority'))).toBeGreaterThan(300);
  });

  it('recusa prioridade fora da faixa, sem gravar', async () => {
    for (const valor of ['0', '-3', '2.5', 'alta']) {
      const { code, saida } = await rodar('priority', '001', '--', valor);
      expect(code, valor).toBe(1);
      expect(saida, valor).toContain('whole number from 1');
    }
    expect(campo('001', 'Priority')).toBe('100');
  });

  it('exige exatamente uma forma', async () => {
    const nenhuma = await rodar('priority', '001');
    const duas = await rodar('priority', '001', '5', '--after', '002');

    expect(nenhuma.code).toBe(1);
    expect(duas.code).toBe(1);
    expect(duas.saida).toContain('exactly one');
  });

  it('com --top, leva a tarefa a frente da fila e muda um arquivo so', async () => {
    const antes = { '001': arquivo('001'), '002': arquivo('002') };

    const { code, saida } = await rodar('priority', '003', '--top');

    expect(code).toBe(0);
    expect(Number(campo('003', 'Priority'))).toBeLessThan(100);
    expect(arquivo('001')).toBe(antes['001']);
    expect(arquivo('002')).toBe(antes['002']);
    expect(saida).toContain('top');
    expect(saida).toContain('1 task file');
  });

  it('com --bottom, numera a cauda sem numero e diz quantos arquivos gravou', async () => {
    writeFileSync(join(raiz, 'TASKS', 'task-004-tarefa-004.md'), tarefa('004'), 'utf-8');

    const { code, saida } = await rodar('priority', '001', '--bottom');

    expect(code).toBe(0);
    expect(campo('004', 'Priority')).toBeDefined();
    expect(Number(campo('001', 'Priority'))).toBeGreaterThan(Number(campo('004', 'Priority')));
    expect(saida).toContain('2 task file');
  });

  it('--top ja no topo nao grava nada, e diz', async () => {
    const antes = arquivo('001');

    const { code, saida } = await rodar('priority', '001', '--top');

    expect(code).toBe(0);
    expect(arquivo('001')).toBe(antes);
    expect(saida).toContain('already');
  });

  it('--top e --bottom sao formas: nao combinam com outra', async () => {
    const comNumero = await rodar('priority', '001', '5', '--top');
    const asDuas = await rodar('priority', '001', '--top', '--bottom');
    const comAfter = await rodar('priority', '001', '--bottom', '--after', '002');

    for (const r of [comNumero, asDuas, comAfter]) {
      expect(r.code).toBe(1);
      expect(r.saida).toContain('exactly one');
    }
    expect(campo('001', 'Priority')).toBe('100');
  });
});

describe('taskin new --group --priority', LENTO, () => {
  it('a tarefa ja nasce no grupo e com a prioridade', async () => {
    await rodar('group', 'add', 'CLI', '--id', 'g-cli');

    const { code } = await rodar('new', '-t', 'feat', '-T', 'Nasce no lugar', '--group', 'g-cli', '--priority', '150');

    expect(code).toBe(0);
    expect(campo('004', 'Group')).toBe('g-cli');
    expect(campo('004', 'Priority')).toBe('150');
  });

  it('grupo inexistente recusa antes de criar o arquivo', async () => {
    const { code, saida } = await rodar('new', '-t', 'feat', '-T', 'Nao nasce', '--group', 'g-sumiu');

    expect(code).toBe(1);
    expect(saida).toContain('g-sumiu');
    expect(readdirSync(join(raiz, 'TASKS')).some((f) => f.startsWith('task-004-'))).toBe(false);
  });

  it('prioridade invalida recusa antes de criar o arquivo', async () => {
    const { code } = await rodar('new', '-t', 'feat', '-T', 'Nao nasce', '--priority', '0');

    expect(code).toBe(1);
    expect(readdirSync(join(raiz, 'TASKS')).some((f) => f.startsWith('task-004-'))).toBe(false);
  });
});

/**
 * Pontuar pela CLI (task-115): a fila do `--unscored` passa a ter o que fazer.
 */
describe('taskin difficulty', LENTO, () => {
  it('grava a dificuldade, e a task sai do --unscored e entra no --scored', async () => {
    const { code, saida } = await rodar('difficulty', '001', '3');

    expect(code).toBe(0);
    expect(saida).toContain('difficulty 3');
    expect(campo('001', 'Difficulty')).toBe('3');
    expect((await rodar('list', '--unscored')).saida).not.toMatch(/\b001\b/);
    expect((await rodar('list', '--scored')).saida).toMatch(/\b001\b/);
  });

  it.each(['0', '6', '2.5', 'dificil', ''])('recusa %j dizendo a faixa, sem gravar', async (valor) => {
    const { code, saida } = await rodar('difficulty', '001', valor);

    expect(code).toBe(1);
    expect(saida).toMatch(/1 to 5/);
    expect(campo('001', 'Difficulty')).toBeUndefined();
  });

  it('recusa uma tarefa que nao existe', async () => {
    const { code, saida } = await rodar('difficulty', '999', '3');

    expect(code).toBe(1);
    expect(saida).toContain('999');
  });
});

describe('taskin new --difficulty', LENTO, () => {
  it('a tarefa ja nasce pontuada', async () => {
    const { code, saida } = await rodar('new', '-t', 'feat', '-T', 'Nasce pontuada', '--difficulty', '4');

    expect(code).toBe(0);
    expect(saida).toContain('Difficulty: 4');
    expect(campo('004', 'Difficulty')).toBe('4');
  });

  it('dificuldade invalida recusa antes de criar o arquivo', async () => {
    const { code, saida } = await rodar('new', '-t', 'feat', '-T', 'Nao nasce', '--difficulty', '7');

    expect(code).toBe(1);
    expect(saida).toMatch(/1 to 5/);
    expect(readdirSync(join(raiz, 'TASKS')).some((f) => f.startsWith('task-004-'))).toBe(false);
  });
});
