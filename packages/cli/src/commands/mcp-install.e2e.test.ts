import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

let raiz: string;

function escrever(relativo: string, conteudo: string): void {
  const caminho = join(raiz, relativo);
  mkdirSync(join(caminho, '..'), { recursive: true });
  writeFileSync(caminho, conteudo, 'utf-8');
}

function lerConfig(): { mcpServers: Record<string, unknown> } {
  return JSON.parse(readFileSync(join(raiz, '.mcp.json'), 'utf-8'));
}

/** Roda o comando a partir de `cwd`, e devolve saida e codigo mesmo em falha. */
async function rodar(cwd: string, ...args: string[]) {
  try {
    const { stdout } = await execFileAsync('node', [CLI, 'mcp-install', '--no-probe', ...args], { cwd });
    return { code: 0, stdout };
  } catch (e) {
    const erro = e as { code?: number; stdout?: string; stderr?: string };
    return { code: erro.code ?? 1, stdout: `${erro.stdout ?? ''}${erro.stderr ?? ''}` };
  }
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-mcp-install-'));
  escrever(
    '.taskin.json',
    JSON.stringify({ version: '1.0.3', provider: { type: 'fs', config: { tasksDir: 'TASKS' } } }),
  );
  escrever('package.json', JSON.stringify({ name: 'projeto', packageManager: 'pnpm@11.0.0' }));
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * `taskin mcp-install`, ponta a ponta.
 *
 * A sonda fica de fora aqui (`--no-probe`): ela sobe um processo de verdade e
 * pertence a outro teste. O que se afirma aqui e onde o arquivo cai e o que
 * ele passa a conter.
 */
describe('taskin mcp-install', () => {
  it('escreve na raiz do projeto', async () => {
    const r = await rodar(raiz);

    expect(r.code).toBe(0);
    expect(lerConfig().mcpServers).toHaveProperty('taskin');
  });

  /*
   * O caso que motivou boa parte desta task: rodando de dentro de um pacote, o
   * arquivo tem que ir para a raiz — e o gerenciador tem que ser detectado la,
   * nao no subdiretorio, que nao tem lockfile nenhum.
   */
  it('rodando de um subdiretorio, escreve na raiz e nao no subdiretorio', async () => {
    const sub = join(raiz, 'packages', 'algum-pacote', 'src');
    mkdirSync(sub, { recursive: true });

    const r = await rodar(sub);

    expect(r.code).toBe(0);
    expect(lerConfig().mcpServers).toHaveProperty('taskin');
    expect(() => readFileSync(join(sub, '.mcp.json'), 'utf-8')).toThrow();
  });

  it('detecta o gerenciador pela raiz, mesmo chamado de fundo', async () => {
    const sub = join(raiz, 'packages', 'algum-pacote');
    mkdirSync(sub, { recursive: true });

    await rodar(sub);

    expect(lerConfig().mcpServers.taskin).toEqual({ command: 'pnpm', args: ['exec', 'taskin', 'mcp-server'] });
  });

  it('preserva os outros servidores ja configurados', async () => {
    escrever('.mcp.json', JSON.stringify({ mcpServers: { github: { command: 'npx', args: ['-y', 'srv'] } } }));

    await rodar(raiz);

    const { mcpServers } = lerConfig();
    expect(Object.keys(mcpServers).sort()).toEqual(['github', 'taskin']);
    expect(mcpServers.github).toEqual({ command: 'npx', args: ['-y', 'srv'] });
  });

  it('nao sobrescreve entrada diferente sem --force, e nao toca no arquivo', async () => {
    const antes = JSON.stringify({ mcpServers: { taskin: { command: 'outro', args: [] } } });
    escrever('.mcp.json', antes);

    const r = await rodar(raiz);

    expect(r.code).not.toBe(0);
    expect(readFileSync(join(raiz, '.mcp.json'), 'utf-8')).toBe(antes);
  });

  it('sobrescreve com --force', async () => {
    escrever('.mcp.json', JSON.stringify({ mcpServers: { taskin: { command: 'outro', args: [] } } }));

    const r = await rodar(raiz, '--force');

    expect(r.code).toBe(0);
    expect(lerConfig().mcpServers.taskin).toEqual({ command: 'pnpm', args: ['exec', 'taskin', 'mcp-server'] });
  });

  it('recusa arquivo malformado sem destrui-lo', async () => {
    const lixo = '{ isto nao e json';
    escrever('.mcp.json', lixo);

    const r = await rodar(raiz);

    expect(r.code).not.toBe(0);
    expect(readFileSync(join(raiz, '.mcp.json'), 'utf-8')).toBe(lixo);
  });

  it('explica em vez de escrever quando nao ha projeto taskin', async () => {
    const fora = mkdtempSync(join(tmpdir(), 'sem-taskin-'));
    try {
      const r = await rodar(fora);

      expect(r.code).not.toBe(0);
      expect(r.stdout).toContain('taskin init');
      expect(() => readFileSync(join(fora, '.mcp.json'), 'utf-8')).toThrow();
    } finally {
      rmSync(fora, { recursive: true, force: true });
    }
  });
});
