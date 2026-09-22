import { describe, expect, it } from 'vitest';
import { mergeMcpConfig } from './merge-mcp-config.js';

const ENTRADA = { command: 'pnpm', args: ['exec', 'taskin', 'mcp-server'] };

/**
 * Fundir a entrada do taskin num `.mcp.json` que nao e nosso.
 *
 * O arquivo e configuracao do agente de quem usa, e pode ter outros servidores
 * dentro. Sobrescrever seria apagar o trabalho de outra pessoa — por isso as
 * unicas saidas sao "escrevi", "ja estava certo", "preciso de permissao" e
 * "nao entendi o arquivo, nao toquei".
 */
describe('mergeMcpConfig', () => {
  it('cria do zero quando nao ha arquivo', () => {
    const r = mergeMcpConfig(undefined, ENTRADA);

    expect(r.outcome).toBe('created');
    if (r.outcome !== 'created') return;
    expect(r.config.mcpServers.taskin).toEqual(ENTRADA);
  });

  it('acrescenta preservando os outros servidores', () => {
    const existente = JSON.stringify({
      mcpServers: {
        github: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-github'] },
      },
    });

    const r = mergeMcpConfig(existente, ENTRADA);

    expect(r.outcome).toBe('added');
    if (r.outcome !== 'added') return;
    expect(Object.keys(r.config.mcpServers).sort()).toEqual(['github', 'taskin']);
    expect(r.config.mcpServers.github).toEqual({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
    });
  });

  it('preserva chaves de topo que nao conhecemos', () => {
    const existente = JSON.stringify({ mcpServers: {}, algumaOutraCoisa: { manter: true } });

    const r = mergeMcpConfig(existente, ENTRADA);

    if (r.outcome !== 'added') throw new Error(`esperava added, veio ${r.outcome}`);
    expect(r.config).toHaveProperty('algumaOutraCoisa', { manter: true });
  });

  it('nao escreve quando a entrada ja esta identica', () => {
    const existente = JSON.stringify({ mcpServers: { taskin: ENTRADA } });

    expect(mergeMcpConfig(existente, ENTRADA).outcome).toBe('unchanged');
  });

  it('pede permissao quando ja ha um taskin diferente', () => {
    const existente = JSON.stringify({
      mcpServers: { taskin: { command: 'npx', args: ['taskin', 'mcp-server'] } },
    });

    const r = mergeMcpConfig(existente, ENTRADA);

    expect(r.outcome).toBe('conflict');
    if (r.outcome !== 'conflict') return;
    expect(r.current).toEqual({ command: 'npx', args: ['taskin', 'mcp-server'] });
  });

  it('sobrescreve o conflito quando autorizado', () => {
    const existente = JSON.stringify({
      mcpServers: { taskin: { command: 'npx', args: ['taskin', 'mcp-server'] } },
    });

    const r = mergeMcpConfig(existente, ENTRADA, { overwrite: true });

    expect(r.outcome).toBe('replaced');
    if (r.outcome !== 'replaced') return;
    expect(r.config.mcpServers.taskin).toEqual(ENTRADA);
  });

  it('recusa JSON invalido em vez de sobrescrever', () => {
    const r = mergeMcpConfig('{ isto nao e json', ENTRADA);

    expect(r.outcome).toBe('unreadable');
  });

  it('recusa tambem quando `mcpServers` nao e objeto', () => {
    expect(mergeMcpConfig(JSON.stringify({ mcpServers: 'oi' }), ENTRADA).outcome).toBe('unreadable');
  });

  it('aceita arquivo sem `mcpServers`, que e configuracao valida e vazia', () => {
    const r = mergeMcpConfig(JSON.stringify({ outraCoisa: 1 }), ENTRADA);

    expect(r.outcome).toBe('added');
  });
});
