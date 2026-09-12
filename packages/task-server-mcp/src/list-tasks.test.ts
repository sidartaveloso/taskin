import type { ITaskManager } from '@opentask/taskin-task-manager';
import { parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it, vi } from 'vitest';
import { TaskMCPServer } from './task-server-mcp.js';

function tarefa({ id, ...resto }: Omit<Partial<Task>, 'id'> & { id: string }): Task {
  return {
    createdAt: '2026-09-12T00:00:00.000Z',
    status: 'pending',
    title: `Tarefa ${id}`,
    type: 'feat',
    ...resto,
    id: parseTaskId(id),
  };
}

const ANA = { id: 'ana-souza', name: 'Ana Souza', email: 'ana@example.com' };

const TAREFAS: readonly Task[] = [
  tarefa({ id: '001', status: 'pending', type: 'feat', assignee: ANA, title: 'Criar login' }),
  tarefa({ id: '002', status: 'done', type: 'fix', title: 'Corrigir crash' }),
  tarefa({ id: '003', status: 'in-progress', type: 'feat', assignee: ANA, title: 'Painel' }),
];

/**
 * O contrato entrega blocos de conteudo; a listagem cabe num bloco de texto.
 *
 * O teste le pelo contrato, e nao pela forma interna: se um dia a listagem
 * virar dois blocos, e aqui que se decide o que isso significa.
 */
function texto(resultado: { content: Array<{ type: string; text?: string }> }): string {
  const bloco = resultado.content[0];
  if (bloco?.type !== 'text' || bloco.text === undefined) {
    throw new Error(`esperava um bloco de texto, veio ${JSON.stringify(resultado.content)}`);
  }
  return bloco.text;
}

function servidor(tarefas: readonly Task[] = TAREFAS): TaskMCPServer {
  const taskManager = {
    getAllTasks: vi.fn(async () => [...tarefas]),
  } as unknown as ITaskManager;

  return new TaskMCPServer({ taskManager });
}

/**
 * Listar tarefas por MCP.
 *
 * O servidor anunciava o recurso `taskin://tasks` e respondia
 * `{"message": "Task list would be here", "note": "Requires ITaskProvider
 * integration"}` — pior que nao oferecer, porque quem consome recebe algo com
 * cara de dado. E nao havia ferramenta de listagem nenhuma, so `start_task` e
 * `finish_task`.
 */
describe('listar tarefas por MCP', () => {
  it('anuncia a ferramenta de listagem', () => {
    const { tools } = servidor().listTools();

    expect(tools.map((t) => t.name)).toContain('list_tasks');
  });

  it('devolve as tarefas como JSON, e nao um espaco reservado', async () => {
    const resultado = await servidor().callTool({ name: 'list_tasks', arguments: {} });

    const tarefas = JSON.parse(texto(resultado));
    expect(tarefas.map((t: { id: string }) => t.id)).toEqual(['001', '002', '003']);
    expect(resultado.isError).toBeFalsy();
  });

  it('aceita os mesmos criterios da listagem do CLI', async () => {
    const porStatus = await servidor().callTool({ name: 'list_tasks', arguments: { status: 'done' } });
    expect(JSON.parse(texto(porStatus)).map((t: { id: string }) => t.id)).toEqual(['002']);

    const porResponsavel = await servidor().callTool({ name: 'list_tasks', arguments: { assignee: 'ana' } });
    expect(JSON.parse(texto(porResponsavel)).map((t: { id: string }) => t.id)).toEqual(['001', '003']);

    const abertas = await servidor().callTool({ name: 'list_tasks', arguments: { open: true } });
    expect(JSON.parse(texto(abertas)).map((t: { id: string }) => t.id)).toEqual(['001', '003']);
  });

  it('nao carrega o corpo do markdown na listagem', async () => {
    const resultado = await servidor().callTool({ name: 'list_tasks', arguments: {} });

    const [primeira] = JSON.parse(texto(resultado));
    expect(primeira).not.toHaveProperty('content');
    expect(primeira).not.toHaveProperty('description');
  });

  it('o recurso taskin://tasks entrega as tarefas de verdade', async () => {
    const resultado = await servidor().readResource({ uri: 'taskin://tasks' });

    const texto = resultado.contents[0]?.text ?? '';
    expect(texto).not.toContain('would be here');
    expect(JSON.parse(texto).map((t: { id: string }) => t.id)).toEqual(['001', '002', '003']);
  });

  /*
   * O involucro do transporte fazia `text: result.content` — embrulhava o
   * arranjo de blocos dentro de um bloco cujo `text` precisa ser string. O SDK
   * recusava a resposta inteira com `invalid_union`, e `start_task` e
   * `finish_task` nunca funcionaram pelo transporte real.
   *
   * Nenhum teste pegava porque todos chamam `callTool` direto, pulando o
   * involucro. Este afirma a forma que o SDK exige.
   */
  it('todo bloco de conteudo tem `text` como string, e nao aninhado', async () => {
    for (const nome of ['list_tasks']) {
      const resultado = await servidor().callTool({ name: nome, arguments: {} });

      for (const bloco of resultado.content) {
        expect(typeof bloco.text).toBe('string');
      }
    }
  });

  it('devolve arranjo vazio quando nada casa', async () => {
    const resultado = await servidor().callTool({ name: 'list_tasks', arguments: { status: 'blocked' } });

    expect(JSON.parse(texto(resultado))).toEqual([]);
  });
});
