import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { probeMcpServer } from './probe-server.js';

let raiz: string;

/**
 * Escreve um servidor MCP de mentira e devolve o comando que o sobe.
 *
 * `anuncia` sao as ferramentas que ele responde em `tools/list`. `null` faz
 * ele morrer sem responder nada.
 */
function servidorFalso(anuncia: string[] | null) {
  const arquivo = join(raiz, 'servidor.mjs');
  const corpo =
    anuncia === null
      ? 'process.exit(3);'
      : `
let buffer = '';
process.stdin.on('data', (pedaco) => {
  buffer += pedaco.toString();
  for (const linha of buffer.split('\\n')) {
    if (!linha.trim()) continue;
    const msg = JSON.parse(linha);
    if (msg.method !== 'tools/list') continue;
    const tools = ${JSON.stringify(anuncia)}.map((name) => ({ name }));
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools } }) + '\\n');
  }
});
setTimeout(() => {}, 10_000);
`;
  writeFileSync(arquivo, corpo, 'utf-8');
  return { command: process.execPath, args: [arquivo] };
}

beforeEach(() => {
  raiz = mkdtempSync(join(tmpdir(), 'taskin-probe-'));
});

afterEach(() => {
  rmSync(raiz, { recursive: true, force: true });
});

/**
 * A sonda sobe o servidor de verdade e fala stdio com ele.
 *
 * O ponto sutil e o ultimo caso: **responder nao basta**. Na primeira execucao
 * real do comando, a entrada gravada alcancou um taskin 3.0.3 instalado
 * globalmente, que respondeu alegremente com as duas ferramentas que ele tinha.
 * Uma sonda que so pergunta "respondeu?" aprova essa entrada errada. Comparar o
 * anunciado com o que esta versao oferece e o que distingue "respondeu" de
 * "respondeu o servidor certo".
 */
describe('probeMcpServer', () => {
  it('aprova quando o servidor anuncia todas as ferramentas esperadas', async () => {
    const r = await probeMcpServer(servidorFalso(['list_tasks', 'start_task', 'finish_task']), raiz, [
      'list_tasks',
      'start_task',
    ]);

    expect(r.ok).toBe(true);
    expect(r.ok && r.tools).toEqual(['list_tasks', 'start_task', 'finish_task']);
  });

  it('recusa quando falta uma esperada — o caso do taskin global de outra versao', async () => {
    const r = await probeMcpServer(servidorFalso(['start_task', 'finish_task']), raiz, [
      'list_tasks',
      'start_task',
      'finish_task',
    ]);

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toContain('list_tasks');
    expect(r.ok === false && r.reason).toContain('outra instalação');
  });

  it('recusa quando o servidor sobe mas nao anuncia ferramenta nenhuma', async () => {
    const r = await probeMcpServer(servidorFalso([]), raiz, ['list_tasks']);

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toContain('ferramenta');
  });

  it('recusa quando o processo morre sem responder', async () => {
    const r = await probeMcpServer(servidorFalso(null), raiz, ['list_tasks']);

    expect(r.ok).toBe(false);
    expect(r.ok === false && r.reason).toContain('3');
  });

  it('recusa quando o comando nem existe', async () => {
    const r = await probeMcpServer({ command: 'taskin-que-nao-existe', args: [] }, raiz, ['list_tasks']);

    expect(r.ok).toBe(false);
  });
});
