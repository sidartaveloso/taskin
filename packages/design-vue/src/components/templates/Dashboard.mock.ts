import { parseTaskId } from '@opentask/taskin-types';
import type { Task, User } from '../../types';

/**
 * Elenco de exemplo do Taskin, para stories e para a imagem da landing page.
 *
 * Personagens nerds de séries no lugar de `Dev 1`, `Dev 2`: um dashboard de
 * demonstração é lido por pessoas, e nome de gente faz o avatar por iniciais e
 * o agrupamento por responsável ficarem legíveis de relance.
 *
 * `claude-agent` está aí de propósito. O servidor MCP deixa um agente trabalhar
 * na mesma fila que o time, e mostrar um deles como responsável comunica isso
 * sem precisar de legenda.
 *
 * Sem `avatar`: o `Avatar` cai nas iniciais, então nada depende de rede.
 */
export const MOCK_CAST = {
  lisa: { id: 'lisa-simpson', name: 'Lisa Simpson', email: 'lisa-simpson@example.com' },
  moss: { id: 'moss', name: 'Maurice Moss', email: 'moss@example.com' },
  agent: { id: 'claude-agent', name: 'Claude (agente MCP)', email: 'claude-agent@example.com' },
  abed: { id: 'abed-nadir', name: 'Abed Nadir', email: 'abed-nadir@example.com' },
  hermione: { id: 'hermione-granger', name: 'Hermione Granger', email: 'hermione-granger@example.com' },
  dustin: { id: 'dustin-henderson', name: 'Dustin Henderson', email: 'dustin-henderson@example.com' },
} satisfies Record<string, User>;

/**
 * Tarefas de exemplo cobrindo os três estados que o dashboard distingue
 * (`in-progress`, `blocked`, `done`), com projeto, estimativa e progresso
 * preenchidos para os cards não aparecerem vazios.
 *
 * @public
 */
export const MOCK_DASHBOARD_TASKS: Task[] = [
  {
    id: parseTaskId('042'),
    number: 42,
    title: 'Contraste dos tokens de status no design system',
    status: 'in-progress',
    type: 'chore',
    assignee: MOCK_CAST.lisa,
    project: { segments: ['taskin', 'design-vue'] },
    estimates: { estimated: 8, spent: 5, remaining: 3 },
    dates: { created: new Date('2026-09-02') },
    progress: { percentage: 65 },
    tags: ['a11y', 'design-system'],
    warnings: [],
  },
  {
    id: parseTaskId('041'),
    number: 41,
    title: 'GitHub Issues como provider de tarefas',
    status: 'in-progress',
    type: 'feat',
    assignee: MOCK_CAST.moss,
    project: { segments: ['taskin', 'providers'] },
    estimates: { estimated: 24, spent: 9, remaining: 15 },
    dates: { created: new Date('2026-09-01') },
    progress: { percentage: 35 },
    tags: ['provider', 'github'],
    warnings: [],
  },
  {
    id: parseTaskId('039'),
    number: 39,
    title: 'Expor o estado do dashboard como browser tools (WebMCP)',
    status: 'in-progress',
    type: 'feat',
    assignee: MOCK_CAST.agent,
    project: { segments: ['taskin', 'dashboard'] },
    estimates: { estimated: 16, spent: 11, remaining: 5 },
    dates: { created: new Date('2026-08-30') },
    progress: { percentage: 70 },
    tags: ['mcp', 'agente'],
    warnings: [],
  },
  {
    id: parseTaskId('037'),
    number: 37,
    title: 'Gerador de imagem no browser com fallback chain',
    status: 'blocked',
    type: 'feat',
    assignee: MOCK_CAST.abed,
    project: { segments: ['taskin', 'dashboard'] },
    estimates: { estimated: 20, spent: 4, remaining: 16 },
    dates: { created: new Date('2026-08-28') },
    progress: { percentage: 20 },
    tags: ['webgpu', 'spike'],
    warnings: ['Bloqueada pela decisão da task-035'],
  },
  {
    id: parseTaskId('034'),
    number: 34,
    title: 'Unificar os ids branded TaskId e GroupId',
    status: 'done',
    type: 'refactor',
    assignee: MOCK_CAST.hermione,
    project: { segments: ['taskin', 'types'] },
    estimates: { estimated: 12, spent: 12, remaining: 0 },
    dates: { created: new Date('2026-08-27') },
    progress: { percentage: 100 },
    tags: ['types', 'breaking'],
    warnings: [],
  },
  {
    id: parseTaskId('028'),
    number: 28,
    title: 'Criar o primeiro usuário no init, new e start',
    status: 'done',
    type: 'feat',
    assignee: MOCK_CAST.dustin,
    project: { segments: ['taskin', 'cli'] },
    estimates: { estimated: 6, spent: 5, remaining: 0 },
    dates: { created: new Date('2026-08-25') },
    progress: { percentage: 100 },
    tags: ['cli', 'onboarding'],
    warnings: [],
  },
];
