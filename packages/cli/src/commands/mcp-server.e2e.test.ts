import { execFile, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { TaskMCPServer } from '@opentask/taskin-task-server-mcp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

const CLI = join(process.cwd(), 'dist/index.js');

let raiz: string;

const requisicao = (id: number, method: string, params?: unknown) =>
  `${JSON.stringify({ jsonrpc: '2.0', id, method, ...(params !== undefined && { params }) })}\n`;

/** Sobe o servidor, faz o aperto de mao, e devolve os dois fluxos separados. */
function conversar(...args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const filho = spawn('node', [CLI, 'mcp-server', ...args], { cwd: raiz });

    let stdout = '';
    let stderr = '';
    filho.stdout.on('data', (p: Buffer) => {
      stdout += p.toString();
    });
    filho.stderr.on('data', (p: Buffer) => {
      stderr += p.toString();
    });

    const terminar = (code: number | null) => resolve({ stdout, stderr, code });
    filho.on('close', terminar);

    filho.stdin.write(
      requisicao(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'teste', version: '1' },
      }),
    );
    filho.stdin.write(requisicao(2, 'tools/list'));

    // O servidor fica vivo de proposito; encerra depois de dar tempo de responder.
    setTimeout(() => filho.kill(), 4000);
  });
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-mcp-server-'));
  writeFileSync(
    join(raiz, '.taskin.json'),
    JSON.stringify({ version: '1.0.3', provider: { type: 'fs', config: { tasksDir: 'TASKS' } } }),
    'utf-8',
  );
  mkdirSync(join(raiz, 'TASKS'), { recursive: true });
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * `taskin mcp-server`, falado de verdade.
 *
 * No transporte stdio o **stdout e o canal do protocolo**. Tudo que sai por ali
 * e mensagem JSON-RPC, e nada mais: a especificacao do MCP e explicita nisso.
 * O comando despejava o cabecalho, o "Initializing task manager..." e a lista
 * de ferramentas no mesmo fluxo. Funcionava por tolerancia dos clientes, que
 * descartam linha que nao parseia — inclusive a sonda do `mcp-install`, que faz
 * isso de proposito. Tolerancia nao e correcao.
 */
describe('taskin mcp-server', () => {
  it('nao escreve nada fora do protocolo no stdout', async () => {
    const { stdout } = await conversar();

    const linhas = stdout.split('\n').filter((l) => l.trim());
    const foraDoProtocolo = linhas.filter((linha) => {
      try {
        return JSON.parse(linha).jsonrpc !== '2.0';
      } catch {
        return true;
      }
    });

    expect(foraDoProtocolo).toEqual([]);
    expect(linhas.length).toBeGreaterThan(0);
  });

  it('mostra o banner para a pessoa, pelo stderr', async () => {
    const { stderr } = await conversar();

    expect(stderr).toContain('MCP');
  });

  /*
   * A lista do banner era escrita a mao e ja tinha ficado para tras: anunciava
   * `start_task` e `finish_task` e esquecia `list_tasks`. O mesmo defeito que a
   * documentacao tinha. Derivar de `listTools()` e o que impede a terceira
   * ocorrencia.
   */
  it('anuncia no banner exatamente as ferramentas que o servidor tem', async () => {
    const { stderr } = await conversar();
    const ferramentas = new TaskMCPServer({ taskManager: {} as never }).listTools().tools.map((t) => t.name);

    for (const nome of ferramentas) {
      expect(stderr).toContain(nome);
    }
  });

  /*
   * `-t sse` estava anunciada no --help e aceita pelo tipo, e o `connect`
   * respondia "Transport sse not yet implemented" depois de ja ter inicializado
   * o provider. Interruptor inerte e defeito: ou existe, ou nao se oferece.
   */
  it('nao oferece um transporte que nao existe', async () => {
    const { stdout } = await execFileAsync('node', [CLI, 'mcp-server', '--help']);

    expect(stdout).not.toContain('sse');
  });

  /*
   * O desenho poderia ter sido manter a flag com um valor legal so e validar o
   * resto. Mas uma opcao que aceita exatamente um valor tambem e inerte: ela
   * some, e quem passar `--transport` ouve isso.
   */
  it('recusa quem ainda tentar escolher transporte', async () => {
    const { stderr, code } = await conversar('--transport', 'sse');

    expect(code).not.toBe(0);
    expect(stderr).toContain("unknown option '--transport'");
  });
});
