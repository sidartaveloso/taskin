import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 60_000 };
const SEGREDO = 'valor-secreto-r4n5';

let raiz: string;
let casa: string;
let estado: string;
let marcas: string;

const tarefa = (id: string) => `# 🧩 Task ${id} — Tarefa ${id}

- Status: pending
- Type: feat
- Assignee: Alguem
- Priority: ${Number(id)}

## Description
Existe para o despacho.

## Tasks
- [ ] Nada

## Notes
Nada.
`;

/**
 * O comando de mentira: marca que comecou, espera a outra task comecar (as
 * duas rodam ao mesmo tempo, ou nenhuma termina bem), diz o que viu no
 * ambiente e escreve o resultado em TASKIN_RUN_RESULT. `modo` muda o fim:
 * `mudo` nao escreve resultado; `preso` fica parado ate ser morto.
 */
const FALSO = `
const fs = require('fs');
const path = require('path');
const [task, marcas, modo] = process.argv.slice(2);
fs.writeFileSync(path.join(marcas, 'comecou-' + task), '');
fs.writeFileSync(path.join(marcas, 'viu-' + task + '.json'), JSON.stringify({
  task: process.env.TASKIN_TASK,
  model: process.env.TASKIN_MODEL,
  result: process.env.TASKIN_RUN_RESULT,
  secret: process.env.ANTHROPIC_API_KEY === ${JSON.stringify(SEGREDO)},
}));
if (modo === 'preso') setTimeout(() => {}, 30000);
else {
  const inicio = Date.now();
  const espera = setInterval(() => {
    const comecadas = fs.readdirSync(marcas).filter((f) => f.startsWith('comecou-')).length;
    if (comecadas >= 2 || Date.now() - inicio > 15000) {
      clearInterval(espera);
      if (comecadas < 2) process.exit(3);
      if (modo !== 'mudo') {
        fs.writeFileSync(process.env.TASKIN_RUN_RESULT, JSON.stringify({
          found: 2, tokens: 1000 + Number(task), iterations: 1, completed: true, reworked: false,
        }));
      }
      process.exit(0);
    }
  }, 50);
}
`;

const ambiente = () => {
  const { TASKIN_MODEL: _, TASKIN_TASK: __, TASKIN_RUN_RESULT: ___, ...herdado } = process.env;
  return { ...herdado, HOME: casa, XDG_STATE_HOME: estado, SITUATION_TOKEN: SEGREDO };
};

async function rodar(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], { cwd: raiz, env: ambiente() });
    return { code: 0, stdout, stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', stderr: falha.stderr ?? '' };
  }
}

const camadaDaPessoa = () => join(casa, '.config', 'taskin', 'resources.json');

/** Grava a aprovacao do comando atual na camada da pessoa, como o `taskin run --allow` num terminal. */
function aprovar(comando: string): void {
  mkdirSync(join(casa, '.config', 'taskin'), { recursive: true });
  const atual = existsSync(camadaDaPessoa()) ? JSON.parse(readFileSync(camadaDaPessoa(), 'utf8')) : {};
  const commandSha256 = createHash('sha256').update(comando).digest('hex');
  writeFileSync(camadaDaPessoa(), JSON.stringify({ ...atual, dispatch: { [basename(raiz)]: { commandSha256 } } }));
}

const comandoAtual = () => JSON.parse(readFileSync(join(raiz, '.taskin.json'), 'utf8')).resources.dispatch.command;

function configurar(
  modo = 'normal',
  recursos: Record<string, unknown> = { defaultSensitivity: 'public' },
  aprovado = true,
): void {
  const falso = join(raiz, 'falso.cjs');
  writeFileSync(falso, FALSO);
  const conta = (name: string) => ({
    kind: 'access',
    name,
    accessKind: 'llm',
    secret: 'env:SITUATION_TOKEN',
    envVar: 'ANTHROPIC_API_KEY',
    concurrencyLimit: 1,
  });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'manual', autoSync: false },
      resources: {
        offers: [conta('conta-a'), conta('conta-b')],
        restrictPersonalMachines: false,
        clearances: {},
        ...recursos,
        scheduling: {
          accesses: { 'conta-a': { model: 'modelo-a' }, 'conta-b': { model: 'modelo-b' } },
          machines: { 'this-machine': { concurrency: 2 } },
        },
        dispatch: { command: `exec node ${JSON.stringify(falso)} {task} ${JSON.stringify(marcas)} ${modo}` },
      },
    }),
  );
  if (aprovado) aprovar(comandoAtual());
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-run-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-run-home-'));
  estado = mkdtempSync(join(tmpdir(), 'taskin-run-state-'));
  marcas = mkdtempSync(join(tmpdir(), 'taskin-run-marcas-'));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(join(raiz, 'TASKS', 'task-001-primeira.md'), tarefa('001'));
  writeFileSync(join(raiz, 'TASKS', 'task-002-segunda.md'), tarefa('002'));
});

afterEach(() => {
  for (const dir of [raiz, casa, estado, marcas]) rmSync(dir, { recursive: true, force: true });
});

const historico = () => join(raiz, '.taskin', 'runs.jsonl');
const daMaquina = () => join(estado, 'taskin', 'runs.jsonl');
const linhas = (file: string) =>
  existsSync(file)
    ? readFileSync(file, 'utf8')
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((l) => JSON.parse(l))
    : [];
const viu = (task: string) => JSON.parse(readFileSync(join(marcas, `viu-${task}.json`), 'utf8'));
const leasesAtivos = () => {
  const file = join(estado, 'taskin', 'leases.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).active : [];
};

describe('taskin run', LENTO, () => {
  it('duas tasks em contas diferentes rodam ao mesmo tempo, e o historico do time ganha duas linhas sem conta', async () => {
    configurar();

    const r = await rodar('run');

    expect(r.code, r.stderr).toBe(0);
    const [um, dois] = [viu('1'), viu('2')];
    expect([um.task, dois.task]).toEqual(['1', '2']);
    expect(new Set([um.model, dois.model])).toEqual(new Set(['modelo-a', 'modelo-b']));
    expect(um.secret && dois.secret).toBe(true);
    expect(um.result).not.toBe(dois.result);

    const time = readFileSync(historico(), 'utf8');
    expect(linhas(historico())).toHaveLength(2);
    expect(
      linhas(historico())
        .map((l) => [l.task, l.model, l.tokens])
        .sort(),
    ).toEqual(
      [
        ['1', um.model, 1001],
        ['2', dois.model, 1002],
      ].sort(),
    );
    for (const proibido of ['conta-a', 'conta-b', `repository:${basename(raiz)}`, 'access', 'At"']) {
      expect(time).not.toContain(proibido);
    }
    const maquina = linhas(daMaquina());
    expect(maquina.filter((l) => l.state === 'started')).toHaveLength(2);
    expect(new Set(maquina.filter((l) => l.state === 'finished').map((l) => l.access)).size).toBe(2);
    expect(leasesAtivos()).toEqual([]);
    expect(r.stdout + r.stderr).not.toContain(SEGREDO);
  });

  it('o comando que nao escreve resultado fecha a execucao como abandonada, so no estado da maquina', async () => {
    configurar('mudo');

    const r = await rodar('run');

    expect(r.code, r.stderr).toBe(0);
    expect(r.stderr).toContain('recorded as abandoned');
    expect(linhas(historico())).toEqual([]);
    expect(linhas(daMaquina()).filter((l) => l.state === 'abandoned')).toHaveLength(2);
  });

  it('ao fim de cada execucao avisa a pessoa pelo canal; aviso que falha nao muda o codigo de saida', async () => {
    configurar();
    await execFileAsync('node', [CLI, 'channels', 'prefer', 'console'], { cwd: raiz, env: ambiente() });

    const avisado = await rodar('run');
    expect(avisado.code, avisado.stderr).toBe(0);
    expect(avisado.stdout).toContain('Task 1 ended: completed');
    expect(avisado.stdout).toContain('Task 2 ended: completed');

    rmSync(marcas, { recursive: true, force: true });
    mkdirSync(marcas);
    await execFileAsync('node', [CLI, 'channels', 'prefer', 'tv-da-sala'], { cwd: raiz, env: ambiente() });
    const recusado = await rodar('run');
    expect(recusado.code, recusado.stderr).toBe(0);
    expect(recusado.stderr).toContain('Notice for task');
    expect(linhas(historico())).toHaveLength(4);
  });

  it('task sem o campo, sem padrao e so com conta public: nao lanca nada e diz por que', async () => {
    configurar('normal', {});

    const r = await rodar('run');

    expect(r.code, r.stderr).toBe(0);
    expect(readdirSync(marcas)).toEqual([]);
    expect(r.stderr).toMatch(/#1 Tarefa 001 — data/);
    expect(r.stderr).toMatch(/#2 Tarefa 002 — data/);
    expect(r.stderr).toContain('sensitivity');
    expect(existsSync(daMaquina())).toBe(false);
  });

  it('task sensivel so sai para a conta liberada, e o access run recebe o valor', async () => {
    configurar('normal', { defaultSensitivity: 'public', clearances: { 'conta-b': 'sensitive' } });
    writeFileSync(
      join(raiz, 'TASKS', 'task-001-primeira.md'),
      tarefa('001').replace('- Type: feat', '- Type: feat\n- Sensitivity: sensitive'),
    );

    const seca = await rodar('run', '--dry-run');
    expect(seca.stdout).toMatch(/#1 Tarefa 001 → conta-b/);

    await rodar('run');
    expect(viu('1').model).toBe('modelo-b');
  });

  it('o access run recusa a conta que nao cobre a sensibilidade que o run repassou', async () => {
    configurar('normal', { defaultSensitivity: 'public', clearances: { 'conta-b': 'sensitive' } });
    const r = await rodar(
      'access',
      'run',
      'llm',
      '--access',
      'conta-a',
      '--sensitivity',
      'sensitive',
      '--',
      'node',
      '-e',
      '0',
    );
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('no-cleared-access');
  });

  it('--dry-run diz por que a task adiada nao sai', async () => {
    configurar('normal', {});
    const r = await rodar('run', '--dry-run');
    expect(r.stdout).toMatch(/#1 Tarefa 001 — data/);
  });

  describe('a aprovacao do comando', () => {
    it('comando novo nao roda: mostra o comando, nao lanca nada, sai com erro e diz como aprovar', async () => {
      configurar('normal', { defaultSensitivity: 'public' }, false);

      const r = await rodar('run');

      expect(r.code).toBe(1);
      expect(r.stderr).toContain(comandoAtual());
      expect(r.stderr).toContain('taskin run --allow');
      expect(readdirSync(marcas)).toEqual([]);
      expect(existsSync(daMaquina())).toBe(false);
      expect(existsSync(historico())).toBe(false);
    });

    it('comando aprovado roda', async () => {
      configurar('normal', { defaultSensitivity: 'public' }, false);
      aprovar(comandoAtual());

      const r = await rodar('run');

      expect(r.code, r.stderr).toBe(0);
      expect(viu('1').secret).toBe(true);
    });

    it('comando alterado volta a pedir aprovacao, e diz que mudou', async () => {
      configurar();
      const config = JSON.parse(readFileSync(join(raiz, '.taskin.json'), 'utf8'));
      config.resources.dispatch.command += ' # mudou';
      writeFileSync(join(raiz, '.taskin.json'), JSON.stringify(config));

      const r = await rodar('run');

      expect(r.code).toBe(1);
      expect(r.stderr).toContain('changed');
      expect(r.stderr).toContain('# mudou');
      expect(readdirSync(marcas)).toEqual([]);
    });

    it('sem terminal, --allow nunca aprova: mostra o comando, sai com erro e nao grava nada', async () => {
      configurar('normal', { defaultSensitivity: 'public' }, false);

      const r = await rodar('run', '--allow');

      expect(r.code).toBe(1);
      expect(r.stderr).toContain(comandoAtual());
      expect(r.stderr).toContain('terminal');
      expect(existsSync(camadaDaPessoa())).toBe(false);
      expect((await rodar('run')).code).toBe(1);
      expect(readdirSync(marcas)).toEqual([]);
    });

    it('--dry-run nao precisa de aprovacao, porque nao lanca nada', async () => {
      configurar('normal', { defaultSensitivity: 'public' }, false);
      const r = await rodar('run', '--dry-run');
      expect(r.code, r.stderr).toBe(0);
      expect(r.stdout).toContain('Would launch now');
    });

    it('a aprovacao mora na camada da pessoa, nunca em arquivo do repositorio', async () => {
      configurar();
      const hash = JSON.parse(readFileSync(camadaDaPessoa(), 'utf8')).dispatch[basename(raiz)].commandSha256;

      await rodar('run');

      for (const arquivo of [join(raiz, '.taskin.json'), historico()]) {
        expect(readFileSync(arquivo, 'utf8')).not.toContain(hash);
      }
    });
  });

  it('--dry-run mostra o que sairia agora, por maquina, conta e modelo, sem lancar nada', async () => {
    configurar();

    const r = await rodar('run', '--dry-run');

    expect(r.code, r.stderr).toBe(0);
    expect(r.stdout).toContain('Would launch now on this-machine:');
    expect(r.stdout).toMatch(/#1 Tarefa 001 → conta-[ab] \(modelo-[ab]\)/);
    expect(r.stdout).toMatch(/#2 Tarefa 002 → conta-[ab] \(modelo-[ab]\)/);
    expect(readdirSync(marcas)).toEqual([]);
    expect(existsSync(daMaquina())).toBe(false);
  });

  it('sem resources.dispatch.command, diz como declarar e nao lanca nada', async () => {
    configurar();
    const config = JSON.parse(readFileSync(join(raiz, '.taskin.json'), 'utf8'));
    delete config.resources.dispatch;
    writeFileSync(join(raiz, '.taskin.json'), JSON.stringify(config));

    const r = await rodar('run');

    expect(r.code).toBe(1);
    expect(r.stderr).toContain('resources.dispatch.command');
    expect(existsSync(daMaquina())).toBe(false);
  });

  it('SIGINT encerra os filhos, devolve as reservas e fecha as execucoes como abandonadas', async () => {
    configurar('preso');
    const filho = spawn('node', [CLI, 'run'], { cwd: raiz, env: ambiente() });
    let saida = '';
    filho.stderr.on('data', (d) => (saida += d));
    const saiu = new Promise<number | null>((resolve) => filho.on('exit', (code) => resolve(code)));
    while (readdirSync(marcas).filter((f) => f.startsWith('viu-')).length < 2 || leasesAtivos().length < 2) {
      await new Promise((r) => setTimeout(r, 50));
    }

    filho.kill('SIGINT');
    const codigo = await saiu;

    expect(codigo, saida).toBe(130);
    expect(leasesAtivos()).toEqual([]);
    expect(linhas(daMaquina()).filter((l) => l.state === 'abandoned')).toHaveLength(2);
    expect(linhas(historico())).toEqual([]);
  });
});
