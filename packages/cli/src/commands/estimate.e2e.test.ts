import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

const LENTO = { timeout: 30_000 };

/** A nota humana de cada task do projeto; `null` e task sem nota. */
const NOTAS: Record<string, { nota: number | null; status: string }> = {
  '001': { nota: 2, status: 'pending' },
  '002': { nota: 4, status: 'paused' },
  '003': { nota: 1, status: 'done' },
  '004': { nota: null, status: 'pending' },
  '005': { nota: null, status: 'done' },
};

const tarefa = (id: string, nota: number | null, status: string) => `# 🧩 Task ${id} — Tarefa ${id}

- Status: ${status}
- Type: feat
- Assignee: Alguem${nota === null ? '' : `\n- Difficulty: ${nota}`}

## Description
A tarefa ${id} existe para ser pontuada.

## Tasks
- [ ] Fazer

## Notes
Nada.
`;

interface Pedido {
  readonly authorization?: string;
  readonly state: string;
}

/**
 * Um servidor System One de mentira. `score` decide a resposta pela task, que
 * ele reconhece pelo titulo no `state` — nunca por uma nota, que nao chega.
 */
class ServidorFalso {
  readonly pedidos: Pedido[] = [];
  private server?: Server;

  constructor(private readonly score: (id: string) => number) {}

  async subir(): Promise<string> {
    const server = createServer(async (req, res) => {
      if (req.method === 'GET' && req.url === '/health') {
        res.end('{"status":"ok"}');
        return;
      }
      const corpo = JSON.parse(await ler(req)) as { state: string };
      this.pedidos.push({ authorization: req.headers.authorization, state: corpo.state });
      const id = corpo.state.match(/Titulo: Tarefa (\d{3})/)?.[1] ?? '000';
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          model: 'fake',
          answers: {
            difficulty: {
              type: 'score',
              score: this.score(id),
              legend: {},
              probabilities: { '0': 1 },
              confidence: 0.9,
            },
          },
          usage: { input_tokens: 50, output_tokens: 0 },
        }),
      );
    });
    this.server = server;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }

  async descer(): Promise<void> {
    await new Promise((resolve) => this.server?.close(resolve));
  }
}

async function ler(req: IncomingMessage): Promise<string> {
  let texto = '';
  for await (const pedaco of req) texto += pedaco;
  return texto;
}

let raiz: string;
/** O Jev de mentira sabe a nota certa de cada task; o Laya diz sempre 4. */
let jev: ServidorFalso;
let laya: ServidorFalso;
let env: Record<string, string>;

async function rodar(extra: Record<string, string>, ...args: string[]): Promise<{ code: number; saida: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, 'estimate', ...args], {
      cwd: raiz,
      env: { ...process.env, ...env, ...extra },
    });
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

const dificuldade = (id: string) => arquivo(id).match(/^- Difficulty: (.+)$/m)?.[1];

beforeEach(async () => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-estimate-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'manual', autoSync: false },
    }),
  );
  for (const [id, { nota, status }] of Object.entries(NOTAS)) {
    writeFileSync(join(raiz, 'TASKS', `task-${id}-tarefa-${id}.md`), tarefa(id, nota, status));
  }
  jev = new ServidorFalso((id) => (NOTAS[id]?.nota ?? 3) - 1);
  laya = new ServidorFalso(() => 3);
  env = { TYPESAFE_API_KEY: 'test-key', JEV_URL: await jev.subir(), LAYA_URL: await laya.subir() };
});

afterEach(async () => {
  await jev.descer();
  await laya.descer();
  rmSync(raiz, { recursive: true, force: true });
});

describe('taskin estimate --rinha', LENTO, () => {
  it('runs Jev x Laya against the human scores, and saves the scoreboard', async () => {
    const { code, saida } = await rodar({}, '--rinha');

    expect(code).toBe(0);
    expect(saida).toContain('Rinha: Jev x Laya against 3 human scores');
    expect(saida).toMatch(/1\s+jev\s+3\/3\s+0\.00\s+100%/);
    expect(saida).toContain('jev is the best model.');
    expect(saida).toContain('It beats the baselines');
    expect(readdirSync(join(raiz, '.taskin', 'rinhas', 'scoreboards'))).toHaveLength(1);
    expect(jev.pedidos).toHaveLength(3);
    expect(jev.pedidos[0]?.authorization).toBe('Bearer test-key');
  });

  it('never sends a human score to Jev or Laya', async () => {
    await rodar({}, '--rinha');
    for (const pedido of [...jev.pedidos, ...laya.pedidos]) expect(pedido.state).not.toMatch(/Difficulty/);
  });

  it('gives the win to Laya by walkover when there is no TYPESAFE_API_KEY', async () => {
    const { code, saida } = await rodar({ TYPESAFE_API_KEY: '' }, '--rinha');

    expect(code).toBe(0);
    expect(saida).toContain('jev will not run: TYPESAFE_API_KEY is not set (in .env or in the environment)');
    expect(saida).toMatch(/-\s+jev\s+did not run: TYPESAFE_API_KEY is not set/);
    expect(saida).toContain('laya is the best model — by walkover (jev did not run).');
    expect(jev.pedidos).toHaveLength(0);
  });

  it('takes the Jev key from the project .env', async () => {
    writeFileSync(join(raiz, '.env'), 'TYPESAFE_API_KEY=from-dotenv\n');
    const { saida } = await rodar({ TYPESAFE_API_KEY: '' }, '--rinha');

    expect(saida).toContain('jev is the best model.');
    expect(jev.pedidos[0]?.authorization).toBe('Bearer from-dotenv');
  });

  it('lets the key exported in the shell win over the .env', async () => {
    writeFileSync(join(raiz, '.env'), 'TYPESAFE_API_KEY=from-dotenv\n');
    await rodar({ TYPESAFE_API_KEY: 'from-shell' }, '--rinha');
    expect(jev.pedidos[0]?.authorization).toBe('Bearer from-shell');
  });

  it('keeps counting what Laya already answered when laya-serve is down', async () => {
    await rodar({}, '--rinha');
    await laya.descer();
    const { code, saida } = await rodar({}, '--rinha');

    expect(code).toBe(0);
    expect(saida).toContain('laya is down, so only its cached answers count');
    expect(saida).toMatch(/laya\s+3\/3/);
    expect(saida).not.toContain('by walkover');
  });

  it('refuses task ids and --apply', async () => {
    const { code, saida } = await rodar({}, '--rinha', '004');
    expect(code).toBe(1);
    expect(saida).toContain('--rinha runs against every task a human scored');
  });
});

describe('taskin estimate', LENTO, () => {
  it('suggests for the open tasks without a score, and writes nothing without a rinha', async () => {
    const antes = arquivo('004');
    const { code, saida } = await rodar({});

    expect(code).toBe(0);
    expect(saida).toMatch(/004\s+Tarefa 004\s+3 90%\s+4 90%\s+no/);
    expect(saida).not.toMatch(/^\s+005\s/m);
    expect(saida).toContain('No suggestion counts yet: no rinha yet');
    expect(arquivo('004')).toBe(antes);
  });

  it('writes the winner suggestion with --apply, only where there is no score', async () => {
    await rodar({}, '--rinha');
    const { code, saida } = await rodar({}, '--apply');

    expect(code).toBe(0);
    expect(saida).toContain('Suggestion from jev won the last rinha.');
    expect(saida).toContain('task-004 now has difficulty 3 (jev).');
    expect(dificuldade('004')).toBe('3');
    expect(dificuldade('001')).toBe('2');
    expect(dificuldade('005')).toBeUndefined();
  });

  it('shows without writing when --apply is missing', async () => {
    await rodar({}, '--rinha');
    const { saida } = await rodar({});
    expect(saida).toContain('Nothing written. Run again with --apply');
    expect(dificuldade('004')).toBeUndefined();
  });

  it('never overwrites a human score, even when asked by id', async () => {
    const { saida } = await rodar({}, '001', '--apply', '--by', 'laya');
    expect(saida).toContain('task-001 already has difficulty 2, from a human: not overwritten.');
    expect(dificuldade('001')).toBe('2');
  });

  it('refuses to apply when the rinha winner does not beat the baselines', async () => {
    await jev.descer();
    jev = new ServidorFalso(() => 4);
    env.JEV_URL = await jev.subir();
    await rodar({}, '--rinha', '--no-cache');

    const { code, saida } = await rodar({}, '--apply');
    expect(code).toBe(1);
    expect(saida).toContain('did not beat the baselines in the last rinha');
    expect(dificuldade('004')).toBeUndefined();
  });

  it('fails, saying why, when neither Jev nor Laya can answer', async () => {
    await laya.descer();
    const { code, saida } = await rodar({ TYPESAFE_API_KEY: '' });
    expect(code).toBe(1);
    expect(saida).toContain('Neither Jev nor Laya can answer');
    expect(saida).toContain('jev: TYPESAFE_API_KEY is not set');
    expect(saida).toMatch(/laya: laya is not reachable at http:\/\/127\.0\.0\.1:\d+\/health/);
  });

  it('crowns the calibrated Jev, and applies its calibrated score', async () => {
    // oito notas humanas: as tres do projeto e mais cinco
    const extras: Record<string, number> = { '006': 2, '007': 2, '008': 3, '009': 5, '010': 2 };
    for (const [id, nota] of Object.entries(extras)) {
      writeFileSync(join(raiz, 'TASKS', `task-${id}-tarefa-${id}.md`), tarefa(id, nota, 'pending'));
    }
    const humanas: Record<string, number> = { '001': 2, '002': 4, '003': 1, ...extras };
    // um Jev que chuta alto, mas na ordem certa; para a task sem nota, 2,75
    await jev.descer();
    jev = new ServidorFalso((id) => {
      const nota = humanas[id];
      return nota === undefined ? 2.75 : 1.5 + nota / 2;
    });
    env.JEV_URL = await jev.subir();

    const rinha = await rodar({}, '--rinha');
    expect(rinha.saida).toMatch(/1\s+jev-calibrated\s+8\/8\s+0\.50/);
    expect(rinha.saida).toContain('jev-calibrated is the best model.');
    expect(rinha.saida).toContain('It beats the baselines');

    const { code, saida } = await rodar({}, '--apply');
    expect(code).toBe(0);
    expect(saida).toContain('Suggestion from jev-calibrated won the last rinha.');
    expect(saida).toContain('Calibrated on the 8 tasks a human scored.');
    expect(saida).toContain('task-004 now has difficulty 3 (jev-calibrated).');
    expect(dificuldade('004')).toBe('3');
  });

  it('refuses an unknown estimator', async () => {
    const { code, saida } = await rodar({}, '--by', 'gpt');
    expect(code).toBe(1);
    expect(saida).toContain("Unknown source 'gpt'. Use --by with one of: jev, laya, jev-calibrated, laya-calibrated.");
  });

  it('keeps the answers in .taskin/rinhas/cache and does not ask twice', async () => {
    await rodar({}, '--rinha');
    const pedidos = jev.pedidos.length;
    await rodar({}, '--rinha');
    expect(jev.pedidos.length).toBe(pedidos);
    expect(existsSync(join(raiz, '.taskin', 'rinhas', 'cache'))).toBe(true);
  });
});
