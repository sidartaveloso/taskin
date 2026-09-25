import type { Task, User } from '@opentask/taskin-design-vue';
import { groupId, taskId } from '@opentask/taskin-design-vue';

/*
 * Tarefas de exemplo para as stories da tela completa. Proprias do dashboard, e
 * nao importadas do design-vue: o mock de la nao sai do pacote, e o que a tela
 * precisa para as stories e pouco — os tres estados que o quadro distingue,
 * dificuldade em algumas e grupo em uma, para a priorizacao ter o que mostrar.
 */
const lisa: User = { id: 'lisa-simpson', name: 'Lisa Simpson', email: 'lisa-simpson@example.com' };
const moss: User = { id: 'moss', name: 'Maurice Moss', email: 'moss@example.com' };
const agente: User = { id: 'claude-agent', name: 'Claude (agente MCP)', email: 'claude-agent@example.com' };

const notificacoes = { type: 'group', id: groupId('g-notificacoes') } as const;

const tarefa = (id: string, extra: Partial<Task>): Task => ({
  id: taskId(id),
  number: Number(id),
  title: `Tarefa ${id}`,
  status: 'pending',
  type: 'feat',
  dates: { created: new Date('2026-09-01') },
  ...extra,
});

export const MOCK_DASHBOARD_TASKS: Task[] = [
  tarefa('042', {
    title: 'Contraste dos tokens de status no design system',
    status: 'in-progress',
    type: 'chore',
    assignee: lisa,
    order: 10,
    difficulty: 2,
    progress: { percentage: 65 },
  }),
  tarefa('041', {
    title: 'GitHub Issues como provider de tarefas',
    status: 'in-progress',
    assignee: moss,
    order: 20,
    difficulty: 5,
    progress: { percentage: 35 },
  }),
  tarefa('078', {
    title: 'lint --fix renumera Priority e apaga conteudo',
    status: 'blocked',
    type: 'fix',
    assignee: agente,
    order: 30,
    difficulty: 1,
  }),
  tarefa('103', {
    title: 'A notificacao vira frase',
    assignee: lisa,
    order: 40,
    parent: notificacoes,
    groupName: 'Notificacoes',
  }),
  tarefa('104', {
    title: 'O link para a propria task na notificacao',
    assignee: moss,
    order: 50,
    parent: notificacoes,
    groupName: 'Notificacoes',
  }),
  tarefa('126', { title: 'Relacionar tasks: dependencia e bloqueio', order: 60 }),
];
