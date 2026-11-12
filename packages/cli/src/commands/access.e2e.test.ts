import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 60_000 };
const SEGREDO = 'valor-secreto-a1b2c3';

let raiz: string;
let casa: string;
let estado: string;

/** O ambiente do teste, sem o TASKIN_MODEL de quem roda a suite: o modelo so chega pelo --model. */
const ambiente = () => {
  const { TASKIN_MODEL: _, ...herdado } = process.env;
  return { ...herdado, HOME: casa, XDG_STATE_HOME: estado, SITUATION_TOKEN: SEGREDO };
};
const leases = () => join(estado, 'taskin', 'leases.json');

async function rodar(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], { cwd: raiz, env: ambiente() });
    return { code: 0, stdout, stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', stderr: falha.stderr ?? '' };
  }
}

/** Um comando que prova, sem imprimir o segredo, que ele chegou ao ambiente. */
const conferirSegredo = (saida: number) =>
  `process.exit(process.env.ANTHROPIC_API_KEY === ${JSON.stringify(SEGREDO)} ? ${saida} : 99)`;

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-access-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-access-home-'));
  estado = mkdtempSync(join(tmpdir(), 'taskin-access-state-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'manual', autoSync: false },
      resources: {
        offers: [
          {
            kind: 'access',
            name: 'claude-main',
            accessKind: 'llm',
            secret: 'env:SITUATION_TOKEN',
            envVar: 'ANTHROPIC_API_KEY',
          },
          {
            kind: 'access',
            name: 'claude-capped',
            accessKind: 'llm-capped',
            secret: 'env:SITUATION_TOKEN',
            envVar: 'ANTHROPIC_API_KEY',
            concurrencyLimit: 1,
          },
          {
            kind: 'access',
            name: 'claude-second',
            accessKind: 'llm-pair',
            secret: 'env:SITUATION_TOKEN',
            envVar: 'ANTHROPIC_API_KEY',
          },
          {
            kind: 'access',
            name: 'claude-third',
            accessKind: 'llm-pair',
            secret: 'env:SITUATION_TOKEN',
            envVar: 'ANTHROPIC_API_KEY',
          },
        ],
        defaultSensitivity: 'public',
        restrictPersonalMachines: false,
        clearances: {},
      },
    }),
  );
});

afterEach(() => {
  for (const dir of [raiz, casa, estado]) rmSync(dir, { recursive: true, force: true });
});

/** O id de uma conta do repositorio no inventario local: o mesmo em todo repositorio e processo. */
const idDaConta = (nome: string) => `repository:path:${realpathSync(raiz)}:${nome}`;
const execucoes = () => join(estado, 'taskin', 'runs.jsonl');

/** Uma execucao que comecou e nao fechou, no estado desta maquina, na conta `nome`. */
const execucaoEmAberto = (nome: string, n: number) =>
  JSON.stringify({ state: 'started', id: `run-aberta-${nome}-${n}`, access: idDaConta(nome), startedAt: Date.now() });

function registrarAbertas(...linhas: string[]): void {
  mkdirSync(join(estado, 'taskin'), { recursive: true });
  writeFileSync(execucoes(), `${linhas.join('\n')}\n`);
}

const contaEscolhida = (stderr: string) => /Using "([^"]+)"/.exec(stderr)?.[1];

describe('taskin access', LENTO, () => {
  it('conta sem capacidade declarada: usa o segredo no ambiente, sai com o codigo do comando e nao grava reserva', async () => {
    const r = await rodar('access', 'run', 'llm', '--task', '7', '--', 'node', '-e', conferirSegredo(3));

    expect(r.code).toBe(3);
    expect(r.stderr).toContain('Using "claude-main"');
    expect(r.stderr).not.toContain('Reserved');
    expect(existsSync(leases())).toBe(false);
    expect((await rodar('access', 'status')).stdout).toContain('No accounts reserved');
  });

  it('conta com capacidade declarada: reserva a vaga, mostra no status e devolve no fim', async () => {
    const r = await rodar('access', 'run', 'llm-capped', '--task', '7', '--', 'node', '-e', conferirSegredo(3));

    expect(r.code).toBe(3);
    expect(r.stderr).toContain('Reserved "claude-capped"');
    expect(JSON.parse(readFileSync(leases(), 'utf8')).active).toEqual([]);
  });

  it('o segredo nunca aparece no stdout, no stderr nem no leases.json, e status mostra a reserva pelo nome logico', async () => {
    const filho = spawn(
      'node',
      [CLI, 'access', 'run', 'llm-capped', '--task', '42', '--', 'node', '-e', 'setTimeout(() => {}, 20000)'],
      { cwd: raiz, env: ambiente() },
    );
    let saidaDoFilho = '';
    filho.stdout.on('data', (d) => (saidaDoFilho += d));
    filho.stderr.on('data', (d) => (saidaDoFilho += d));
    while (!existsSync(leases()) || JSON.parse(readFileSync(leases(), 'utf8')).active.length === 0) {
      await new Promise((r) => setTimeout(r, 50));
    }

    const status = await rodar('access', 'status');
    const json = await rodar('access', 'status', '--json');
    const cheia = await rodar('access', 'run', 'llm-capped', '--', 'node', '-e', '0');
    const arquivo = readFileSync(leases(), 'utf8');
    const saiu = new Promise<number | null>((resolve) => filho.on('exit', (code) => resolve(code)));
    filho.kill('SIGINT');
    const codigo = await saiu;

    expect(status.stdout).toContain('claude-capped');
    expect(status.stdout).toContain('task 42');
    expect(JSON.parse(json.stdout)).toMatchObject([{ access: 'claude-capped', task: '42', shared: false }]);
    expect(cheia.code).toBe(1);
    expect(cheia.stderr).toContain('all-at-provider-limit');
    for (const texto of [status.stdout, status.stderr, json.stdout, json.stderr, arquivo, saidaDoFilho]) {
      expect(texto).not.toContain(SEGREDO);
    }
    expect(codigo).toBe(130);
    expect(JSON.parse(readFileSync(leases(), 'utf8')).active).toEqual([]);
    expect((await rodar('access', 'status')).stdout).toContain('No accounts reserved');
  });

  it('o segredo de uma conta sem capacidade declarada tambem nao aparece, e nenhum arquivo de reserva nasce', async () => {
    const r = await rodar(
      'access',
      'run',
      'llm',
      '--',
      'node',
      '-e',
      'console.log(process.env.ANTHROPIC_API_KEY.length)',
    );

    expect(r.code).toBe(0);
    expect(r.stdout.trim()).toBe(String(SEGREDO.length));
    expect(r.stdout + r.stderr).not.toContain(SEGREDO);
    expect(existsSync(leases())).toBe(false);
  });

  it('entre duas contas sem capacidade declarada, a rodada vai a que tem menos execucoes em aberto no estado da maquina', async () => {
    const escolha = async () =>
      contaEscolhida((await rodar('access', 'run', 'llm-pair', '--', 'node', '-e', '0')).stderr);

    const semNada = await escolha();
    registrarAbertas(execucaoEmAberto('claude-second', 1));
    const umaNaPrimeira = await escolha();
    registrarAbertas(execucaoEmAberto('claude-third', 1));
    const umaNaSegunda = await escolha();
    registrarAbertas(
      execucaoEmAberto('claude-second', 1),
      execucaoEmAberto('claude-second', 2),
      execucaoEmAberto('claude-third', 1),
    );
    const duasContraUma = await escolha();

    expect(semNada).toBe('claude-second');
    expect(umaNaPrimeira).toBe('claude-third');
    expect(umaNaSegunda).toBe('claude-second');
    expect(duasContraUma).toBe('claude-third');
    expect(existsSync(leases())).toBe(false);
    expect(existsSync(join(raiz, '.taskin', 'runs.jsonl'))).toBe(false);
  });

  it('com --access, usa a conta que o plano fixou, mesmo havendo outra menos ocupada', async () => {
    registrarAbertas(execucaoEmAberto('claude-third', 1));

    const r = await rodar('access', 'run', 'llm-pair', '--access', 'claude-third', '--', 'node', '-e', '0');

    expect(r.code).toBe(0);
    expect(contaEscolhida(r.stderr)).toBe('claude-third');
  });

  it('a conta fixada sem liberacao, ou que nao existe, e recusada sem rodar o comando', async () => {
    const marca = join(raiz, 'rodou');
    const escreveMarca = `require('fs').writeFileSync(${JSON.stringify(marca)}, '')`;
    const semLiberacao = await rodar(
      'access',
      'run',
      'llm-pair',
      '--access',
      'claude-third',
      '--sensitivity',
      'sensitive',
      '--',
      'node',
      '-e',
      escreveMarca,
    );
    const inexistente = await rodar(
      'access',
      'run',
      'llm-pair',
      '--access',
      'claude-z',
      '--',
      'node',
      '-e',
      escreveMarca,
    );

    expect(semLiberacao.code).toBe(1);
    expect(semLiberacao.stderr).toContain('no-cleared-access');
    expect(inexistente.code).toBe(1);
    expect(inexistente.stderr).toContain('unknown-access');
    expect(existsSync(marca)).toBe(false);
  });

  it('com --model, o comando recebe o modelo do plano em TASKIN_MODEL; sem ele, a variavel nao e posta', async () => {
    const mostraModelo = 'console.log(process.env.TASKIN_MODEL ?? "-")';
    const com = await rodar('access', 'run', 'llm', '--model', 'claude-opus', '--', 'node', '-e', mostraModelo);
    const sem = await rodar('access', 'run', 'llm', '--', 'node', '-e', mostraModelo);

    expect(com.stdout.trim()).toBe('claude-opus');
    expect(sem.stdout.trim()).toBe('-');
  });

  it('sem --sensitivity vale o padrao do repositorio, e sem padrao vale internal, nunca public', async () => {
    const config = JSON.parse(readFileSync(join(raiz, '.taskin.json'), 'utf8'));
    delete config.resources.defaultSensitivity;
    writeFileSync(join(raiz, '.taskin.json'), JSON.stringify(config));

    const r = await rodar('access', 'run', 'llm', '--', 'node', '-e', '0');

    expect(r.code).toBe(1);
    expect(r.stderr).toContain('no-cleared-access');
  });

  it('com --task, vale a sensibilidade da task, e a flag nao a abre', async () => {
    writeFileSync(
      join(raiz, 'TASKS', 'task-042-segredo.md'),
      '# Task 042 — Segredo\n\n- Status: pending\n- Type: feat\n- Assignee: Alguem\n- Sensitivity: sensitive\n\n## Description\nx\n',
    );

    const semFlag = await rodar('access', 'run', 'llm', '--task', '42', '--', 'node', '-e', '0');
    const comFlag = await rodar(
      'access',
      'run',
      'llm',
      '--task',
      '42',
      '--sensitivity',
      'public',
      '--',
      'node',
      '-e',
      '0',
    );

    expect(semFlag.code).toBe(1);
    expect(semFlag.stderr).toContain('no-cleared-access');
    expect(comFlag.code).toBe(1);
    expect(comFlag.stderr).toContain('no-cleared-access');
  });

  it('o comando que falha tambem devolve a reserva', async () => {
    const r = await rodar('access', 'run', 'llm-capped', '--', 'node', '-e', 'process.exit(1)');

    expect(r.code).toBe(1);
    expect(JSON.parse(readFileSync(leases(), 'utf8')).active).toEqual([]);
  });

  it('negado, sai com erro e o motivo, sem rodar o comando', async () => {
    const marca = join(raiz, 'rodou');
    const semTipo = await rodar(
      'access',
      'run',
      'gpu',
      '--',
      'node',
      '-e',
      `require('fs').writeFileSync(${JSON.stringify(marca)}, '')`,
    );
    const semLiberacao = await rodar('access', 'run', 'llm', '--sensitivity', 'sensitive', '--', 'node', '-e', '0');

    expect(semTipo.code).toBe(1);
    expect(semTipo.stderr).toContain('no-access-of-kind');
    expect(existsSync(marca)).toBe(false);
    expect(semLiberacao.code).toBe(1);
    expect(semLiberacao.stderr).toContain('no-cleared-access');
  });
});
