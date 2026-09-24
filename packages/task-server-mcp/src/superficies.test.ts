import { type IGroupRegistry, type ITaskProvider, nomesNaSuperficie, TaskManager } from '@opentask/taskin-task-manager';
import { registroDeGruposEmMemoria } from '@opentask/taskin-task-manager/testing';
import { describe, expect, it } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';

/**
 * O servidor MCP anuncia cada ferramenta que `SUPERFICIES_DAS_OPERACOES` diz
 * que ele atende — com um provider que tem grupos e aninhamento, onde nada
 * fica de fora.
 */
describe('ferramentas do MCP x SUPERFICIES_DAS_OPERACOES', () => {
  const groupRegistry: IGroupRegistry = registroDeGruposEmMemoria();
  const provider: ITaskProvider & { groupRegistry: IGroupRegistry } = {
    initialize: async () => {},
    findTask: async () => undefined,
    getAllTasks: async () => [],
    updateTask: async () => {},
    createTask: async () => {
      throw new Error('nao usado');
    },
    lint: async () => ({ valid: true, issues: [], errorCount: 0, warningCount: 0, infoCount: 0 }),
    groupRegistry,
  };
  const anunciadas = new TaskMCPServer({ taskManager: new TaskManager(provider) }).listTools().tools.map((t) => t.name);

  it.each(nomesNaSuperficie('mcp'))('a ferramenta %s e anunciada', (nome) => {
    expect(anunciadas).toContain(nome);
  });
});
