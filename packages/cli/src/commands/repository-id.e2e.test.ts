import { execFile, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const CLI = join(process.cwd(), 'dist/index.js');
const LENTO = { timeout: 90_000 };
const TOKEN = 'token-secreto-r9t7';
const ID = 'github.com/dono/nome';

let base: string;
let casa: string;
let estado: string;

const ambiente = () => ({ ...process.env, HOME: casa, XDG_STATE_HOME: estado, SITUATION_TOKEN: 'x' });

async function rodar(cwd: string, ...args: string[]) {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args], { cwd, env: ambiente() });
    return { code: 0, stdout, stderr };
  } catch (e) {
    const falha = e as { code?: number; stdout?: string; stderr?: string };
    return { code: falha.code ?? 1, stdout: falha.stdout ?? '', stderr: falha.stderr ?? '' };
  }
}

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe', encoding: 'utf8' });

function projeto(pasta: string, remote?: string, recursos: Record<string, unknown> = {}): string {
  const raiz = join(base, pasta);
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({
      version: '1.0.3',
      provider: { type: 'fs', config: { tasksDir: 'TASKS' } },
      automation: { level: 'manual', autoSync: false },
      resources: {
        offers: [],
        restrictPersonalMachines: false,
        clearances: {},
        defaultSensitivity: 'public',
        ...recursos,
      },
    }),
  );
  writeFileSync(
    join(raiz, 'TASKS', 'task-001-a.md'),
    '# Task 001 — A\n\n- Status: pending\n- Type: feat\n- Assignee: Alguem\n\n## Description\nx\n',
  );
  if (remote !== undefined) {
    git(raiz, 'init', '-q');
    git(raiz, 'remote', 'add', 'origin', remote);
  }
  return raiz;
}

function contaPessoal(releasedTo: string[]): void {
  mkdirSync(join(casa, '.config', 'taskin'), { recursive: true });
  writeFileSync(
    join(casa, '.config', 'taskin', 'resources.json'),
    JSON.stringify({
      [userInfo().username]: [
        {
          declaration: {
            kind: 'access',
            name: 'conta-pessoal',
            accessKind: 'llm',
            secret: 'env:SITUATION_TOKEN',
            envVar: 'K',
          },
          releasedTo,
        },
      ],
    }),
  );
}

const repositorioDoPlano = async (cwd: string) => JSON.parse((await rodar(cwd, 'plan', '--json')).stdout).repository;
const contasDoPlano = async (cwd: string) =>
  Object.values(
    JSON.parse((await rodar(cwd, 'plan', '--json')).stdout).resources as Record<string, { name: string }>,
  ).map((r) => r.name);

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'taskin-repo-id-'));
  casa = mkdtempSync(join(tmpdir(), 'taskin-repo-id-home-'));
  estado = mkdtempSync(join(tmpdir(), 'taskin-repo-id-state-'));
});

afterEach(() => {
  for (const dir of [base, casa, estado]) rmSync(dir, { recursive: true, force: true });
});

describe('o id do repositorio, pelo binario', LENTO, () => {
  it('ssh e https, em pastas diferentes, dao o mesmo id, sem aviso', async () => {
    const a = projeto('clone-a', 'git@github.com:dono/nome.git');
    const b = projeto('outro-nome', 'https://github.com/dono/nome.git');

    expect(await repositorioDoPlano(a)).toBe(ID);
    expect(await repositorioDoPlano(b)).toBe(ID);
    expect((await rodar(a, 'plan', '--json')).stderr).toBe('');
  });

  it('um worktree tem o mesmo id do repositorio', async () => {
    const raiz = projeto('principal', 'git@github.com:dono/nome.git');
    git(raiz, 'add', '-A');
    git(raiz, '-c', 'user.name=T', '-c', 'user.email=t@example.com', 'commit', '-qm', 'x');
    const outro = join(base, 'worktree-em-outra-pasta');
    git(raiz, 'worktree', 'add', '-q', outro);

    expect(await repositorioDoPlano(outro)).toBe(ID);
  });

  it('o clone copiado para outra pasta enxerga o historico do time', async () => {
    const raiz = projeto('clone-a', 'git@github.com:dono/nome.git');
    mkdirSync(join(raiz, '.taskin'), { recursive: true });
    writeFileSync(
      join(raiz, '.taskin', 'runs.jsonl'),
      `${JSON.stringify({ id: 'run-1', repository: ID, task: '1', estimated: 3, found: 3, model: 'm', tokens: 7, iterations: 1, completed: true, reworked: false, duration: 1 })}\n`,
    );
    const copia = join(base, 'clone-b');
    cpSync(raiz, copia, { recursive: true });

    expect(JSON.parse((await rodar(copia, 'plan', '--json')).stdout).history).toBe(true);
  });

  it('usuario e token do remote nao aparecem no id, na saida nem no que se grava', async () => {
    const raiz = projeto('pasta', `https://usuario:${TOKEN}@github.com/dono/nome.git`);

    const r = await rodar(raiz, 'plan', '--json');

    expect(JSON.parse(r.stdout).repository).toBe(ID);
    expect(r.stdout + r.stderr).not.toContain(TOKEN);
    expect(r.stdout + r.stderr).not.toContain('usuario');
    expect(readFileSync(join(raiz, '.taskin.json'), 'utf8')).not.toContain(TOKEN);
    expect(existsSync(join(raiz, '.taskin', 'runs.jsonl'))).toBe(false);
  });

  it('resources.repository nomeia o historico, e nao avisa por ser diferente do origin', async () => {
    const raiz = projeto('pasta', 'git@github.com:dono/nome.git', { repository: 'time/app' });
    const r = await rodar(raiz, 'plan', '--json');
    expect(JSON.parse(r.stdout).repository).toBe('time/app');
    expect(r.stderr).toBe('');
  });

  describe('um .taskin.json que declara o id de outro repositorio', () => {
    const COMANDO = 'pnpm exec tsx .sandcastle/main.ts --task {task}';
    const aprovacao = () => ({ [ID]: { commandSha256: createHash('sha256').update(COMANDO).digest('hex') } });

    function pessoaConfiaEm(id: string): void {
      contaPessoal([id]);
      const arquivo = join(casa, '.config', 'taskin', 'resources.json');
      const atual = JSON.parse(readFileSync(arquivo, 'utf8'));
      writeFileSync(arquivo, JSON.stringify({ ...atual, dispatch: aprovacao() }));
    }

    it('o repositorio de verdade, com a conta e o comando aprovados, roda', async () => {
      const raiz = projeto('verdadeiro', 'git@github.com:dono/nome.git', { dispatch: { command: COMANDO } });
      pessoaConfiaEm(ID);

      expect(await contasDoPlano(raiz)).toContain('conta-pessoal');
      expect((await rodar(raiz, 'run')).stderr).not.toContain('not approved');
    });

    it('com o mesmo texto de comando, nao herda a liberacao nem a aprovacao', async () => {
      const raiz = projeto('isca', 'git@github.com:atacante/isca.git', {
        repository: ID,
        dispatch: { command: COMANDO },
      });
      pessoaConfiaEm(ID);

      expect(await repositorioDoPlano(raiz)).toBe(ID);
      expect(await contasDoPlano(raiz)).not.toContain('conta-pessoal');
      const r = await rodar(raiz, 'run');
      expect(r.code).toBe(1);
      expect(r.stderr).toContain('not approved');
      expect(r.stderr).toContain(COMANDO);
    });

    it('sem origin, baixado como arquivo, tambem nao herda', async () => {
      const raiz = projeto('baixado', undefined, { repository: ID, dispatch: { command: COMANDO } });
      pessoaConfiaEm(ID);

      expect(await contasDoPlano(raiz)).not.toContain('conta-pessoal');
      expect((await rodar(raiz, 'run')).code).toBe(1);
    });
  });

  it('um remote de maquina privada da confianca entre clones, sem ir ao historico', async () => {
    const a = projeto('clone-a', 'git@maquina-de-casa:repos/nome.git');
    const b = projeto('clone-b', 'git@maquina-de-casa:repos/nome.git');
    contaPessoal(['maquina-de-casa/repos/nome']);

    expect(await contasDoPlano(a)).toContain('conta-pessoal');
    expect(await contasDoPlano(b)).toContain('conta-pessoal');
    expect(await repositorioDoPlano(a)).toBe('clone-a');
  });

  it('duas pastas de mesmo nome, sem origin, nao dividem a liberacao', async () => {
    const a = projeto(join('um', 'app-loja'));
    const b = projeto(join('dois', 'app-loja'));
    contaPessoal([`path:${realpathSync(a)}`]);

    expect(await contasDoPlano(a)).toContain('conta-pessoal');
    expect(await contasDoPlano(b)).not.toContain('conta-pessoal');
  });

  it('sem os dois, cai na pasta e avisa em stderr, sem sujar o JSON', async () => {
    const raiz = projeto('so-a-pasta');
    const r = await rodar(raiz, 'plan', '--json');
    expect(JSON.parse(r.stdout).repository).toBe('so-a-pasta');
    expect(r.stderr).toContain('resources.repository');
  });

  it('a conta liberada pelo nome da pasta deixa de valer, e o aviso diz como refazer; liberada pelo id, vale', async () => {
    const raiz = projeto('app-loja', 'git@github.com:dono/nome.git');

    contaPessoal(['app-loja']);
    const antiga = await rodar(raiz, 'plan', '--json');
    expect(await contasDoPlano(raiz)).not.toContain('conta-pessoal');
    expect(antiga.stderr).toContain('releasedTo');
    expect(antiga.stderr).toContain(ID);

    contaPessoal([ID]);
    expect(await contasDoPlano(raiz)).toContain('conta-pessoal');
  });

  it('uma pasta com o mesmo nome em outro repositorio nao herda a liberacao', async () => {
    const raiz = projeto('app-loja', 'git@github.com:outra-pessoa/outro-repo.git');
    contaPessoal([ID]);
    expect(await contasDoPlano(raiz)).not.toContain('conta-pessoal');
  });

  it('o taskin status usa o mesmo id', async () => {
    const raiz = projeto('pasta', 'git@github.com:dono/nome.git');
    expect(JSON.parse((await rodar(raiz, 'status', '--json')).stdout).repository).toBe(ID);
  });
});
