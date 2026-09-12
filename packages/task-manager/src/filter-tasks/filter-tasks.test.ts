import { parseTaskId, type Task } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { filterTasks } from './filter-tasks.js';

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
const JOAO = { id: 'joao', name: 'João Silva', email: 'joao@example.com' };

/**
 * A selecao de tarefas, isolada de como ela e exibida.
 *
 * Existiam duas implementacoes divergentes: o comando `list` casava assignee
 * por substring em nome **ou** id, e o `Taskin.list` casava `userId` exato — e
 * ainda projetava a task derrubando o proprio `assignee`. Duas respostas
 * diferentes para a mesma pergunta, e o servidor MCP sem nenhuma.
 */
describe('filterTasks', () => {
  const TAREFAS: readonly Task[] = [
    tarefa({ id: '001', status: 'pending', type: 'feat', assignee: ANA, title: 'Criar login' }),
    tarefa({ id: '002', status: 'done', type: 'fix', assignee: JOAO, title: 'Corrigir crash' }),
    tarefa({ id: '003', status: 'in-progress', type: 'feat', assignee: ANA, title: 'Painel de metricas' }),
    tarefa({ id: '004', status: 'blocked', type: 'chore', title: 'Sem responsavel' }),
    tarefa({ id: '005', status: 'canceled', type: 'docs', assignee: JOAO, title: 'Guia antigo' }),
  ];

  it('sem criterio, devolve tudo na ordem recebida', () => {
    expect(filterTasks(TAREFAS, {}).map((t) => t.id)).toEqual(['001', '002', '003', '004', '005']);
  });

  it('filtra por status', () => {
    expect(filterTasks(TAREFAS, { status: 'done' }).map((t) => t.id)).toEqual(['002']);
  });

  it('filtra por tipo', () => {
    expect(filterTasks(TAREFAS, { type: 'feat' }).map((t) => t.id)).toEqual(['001', '003']);
  });

  it('`open` traz o que ainda esta em aberto, e nao o que foi encerrado', () => {
    expect(filterTasks(TAREFAS, { open: true }).map((t) => t.id)).toEqual(['001', '003', '004']);
  });

  it('`closed` traz done e canceled', () => {
    expect(filterTasks(TAREFAS, { closed: true }).map((t) => t.id)).toEqual(['002', '005']);
  });

  it('casa o assignee pelo id, pelo nome e por parte dele', () => {
    expect(filterTasks(TAREFAS, { assignee: 'ana-souza' }).map((t) => t.id)).toEqual(['001', '003']);
    expect(filterTasks(TAREFAS, { assignee: 'Ana Souza' }).map((t) => t.id)).toEqual(['001', '003']);
    expect(filterTasks(TAREFAS, { assignee: 'ana' }).map((t) => t.id)).toEqual(['001', '003']);
  });

  it('nao devolve tarefa sem responsavel quando se filtra por um', () => {
    expect(filterTasks(TAREFAS, { assignee: 'ana' }).map((t) => t.id)).not.toContain('004');
  });

  it('o texto livre procura em id, titulo, status e responsavel', () => {
    expect(filterTasks(TAREFAS, { text: 'crash' }).map((t) => t.id)).toEqual(['002']);
    expect(filterTasks(TAREFAS, { text: '003' }).map((t) => t.id)).toEqual(['003']);
    expect(filterTasks(TAREFAS, { text: 'blocked' }).map((t) => t.id)).toEqual(['004']);
    expect(filterTasks(TAREFAS, { text: 'joão' }).map((t) => t.id)).toEqual(['002', '005']);
  });

  it('combina criterios, exigindo todos', () => {
    expect(filterTasks(TAREFAS, { type: 'feat', assignee: 'ana', status: 'pending' }).map((t) => t.id)).toEqual([
      '001',
    ]);
  });

  it('nao altera o arranjo recebido', () => {
    const original = [...TAREFAS];
    filterTasks(TAREFAS, { status: 'done' });
    expect(TAREFAS).toEqual(original);
  });
});
