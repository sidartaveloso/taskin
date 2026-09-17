/**
 * list command - List all tasks in the project
 */

import {
  agruparTarefas,
  filterCriteriaCliOptions,
  filterTasks,
  ordenarTarefas,
  parseFilterCriteria,
  summarizeTask,
} from '@opentask/taskin-task-manager';
import type { ListTasksOptions, Task, TaskStatus, TaskType } from '@opentask/taskin-types';
import path from 'path';
import { colors, printHeader } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';

export const listCommand = defineCommand({
  name: 'list [filter]',
  description: '📊 List all tasks in the project',
  alias: 'ls',
  /*
   * As opcoes de filtro saem do schema unico em `filterCriteriaCliOptions`, nao
   * de uma lista escrita a mao aqui — a mesma definicao alimenta o schema JSON
   * do MCP. O `--json` fica manual de proposito: e formato de saida, nao
   * criterio.
   */
  options: [
    {
      flags: '--sort <mode>',
      description: 'Order: manual (priority), diff-asc or diff-desc',
      defaultValue: 'manual',
    },
    ...filterCriteriaCliOptions(),
    {
      flags: '--json',
      description: 'Print the tasks as JSON, for other tools to consume',
    },
  ],
  handler: async (filter: string | undefined, options: ListTasksOptions) => {
    await listTasks(filter, options);
  },
});

/**
 * Os nomes dos grupos, quando o provider tem o conceito.
 *
 * Um provider sem grupos nao expoe o registro, e a saida sai com `name`
 * indefinido — o id ainda identifica o grupo.
 */
async function nomesDeGrupo(provider: unknown): Promise<Record<string, string>> {
  const registro = (provider as { groupRegistry?: { listGroups: () => Promise<{ id: string; name: string }[]> } })
    .groupRegistry;
  if (!registro) return {};

  try {
    return Object.fromEntries((await registro.listGroups()).map((g) => [g.id, g.name]));
  } catch {
    return {};
  }
}

async function listTasks(filter: string | undefined, options: ListTasksOptions): Promise<void> {
  // Check if project is initialized
  requireTaskinProject();

  /*
   * Com `--json` nada de decoracao vai para o stdout — nem cabecalho, nem
   * aviso de lista vazia. Quem consome faz `JSON.parse` na saida inteira, e
   * uma linha a mais quebra isso.
   */
  const comoJson = options.json === true;

  if (!comoJson) {
    printHeader('Task List', '📊');
  }

  // Find TASKS directory
  const { provider: taskProvider } = await resolveTaskProvider();

  // Get all tasks
  const tasks = await taskProvider.getAllTasks();

  if (tasks.length === 0 && !comoJson) {
    console.log(colors.warning('No tasks found in TASKS/ directory'));
    return;
  }

  /*
   * A selecao vive em `filterTasks`, no pacote agnostico, e nao aqui.
   *
   * O criterio sai do `parse` do schema unico: nada de mapeamento a mao. O
   * argumento posicional `filter` e o criterio `text`; o `--json` e as demais
   * chaves que nao sao criterio o `parse` descarta.
   */
  const criteria = parseFilterCriteria({ ...options, ...(filter && { text: filter }) });

  const filteredTasks = ordenarTarefas(filterTasks(tasks, criteria), options.sort);

  if (comoJson) {
    /*
     * A saida de maquina leva os grupos, e nao tarefas planas.
     *
     * `--json` nao e a interface do agente: e a interface de maquina do produto,
     * e serve script, painel de terceiro e passo de CI. Emitir plano empurraria
     * a regra de agrupamento para cada consumidor reimplementar. Quem quiser
     * plano achata em uma linha; quem recebe plano nao reagrupa sem copiar a
     * regra.
     *
     * Vai a estrutura semantica — grupo, id, membros, e quantos o filtro
     * escondeu — e nao a decoracao de apresentacao.
     */
    const totais = tasks.reduce<Record<string, number>>((acc, t) => {
      if (t.groupId !== undefined) acc[String(t.groupId)] = (acc[String(t.groupId)] ?? 0) + 1;
      return acc;
    }, {});

    const nos = agruparTarefas(filteredTasks, await nomesDeGrupo(taskProvider), totais).map((no) =>
      no.kind === 'task'
        ? summarizeTask(no.task)
        : { group: { id: no.groupId, name: no.groupName, hidden: no.hidden }, tasks: no.tasks.map(summarizeTask) },
    );

    console.log(JSON.stringify(nos, null, 2));
    return;
  }

  if (filteredTasks.length === 0) {
    console.log(colors.warning('No tasks match the filters'));
    return;
  }

  // Display tasks
  console.log(
    colors.highlight(`${'ID'.padEnd(15)} ${'Status'.padEnd(15)} ${'Type'.padEnd(12)} ${'User'.padEnd(15)} ${'Title'}`),
  );
  console.log(colors.secondary('─'.repeat(100)));

  filteredTasks.forEach((task) => {
    const statusColor = getStatusColor(task.status);
    const typeColor = getTypeColor(task.type);

    console.log(
      `${colors.info(task.id.padEnd(15))} ${statusColor(task.status.padEnd(15))} ${typeColor(task.type.padEnd(12))} ${colors.secondary((task.assignee?.name || 'unassigned').padEnd(15))} ${colors.normal(task.title)}`,
    );
  });

  console.log();
  console.log(colors.secondary('─'.repeat(100)));

  // Summary
  const statusCounts = {
    pending: filteredTasks.filter((t) => t.status === 'pending').length,
    'in-progress': filteredTasks.filter((t) => t.status === 'in-progress').length,
    paused: filteredTasks.filter((t) => t.status === 'paused').length,
    done: filteredTasks.filter((t) => t.status === 'done').length,
    blocked: filteredTasks.filter((t) => t.status === 'blocked').length,
  };

  console.log(
    colors.info(
      `📊 Total: ${filteredTasks.length} tasks | ⏳ Pending: ${statusCounts.pending} | 🚀 In Progress: ${statusCounts['in-progress']} | ⏸️  Paused: ${statusCounts.paused} | ✅ Done: ${statusCounts.done} | 🚫 Blocked: ${statusCounts.blocked}`,
    ),
  );
  console.log();
}

function getStatusColor(status: TaskStatus): (text: string) => string {
  switch (status) {
    case 'pending':
      return colors.secondary;
    case 'in-progress':
      return colors.info;
    case 'paused':
      return colors.warning;
    case 'done':
      return colors.success;
    case 'blocked':
      return colors.error;
    default:
      return colors.normal;
  }
}

function getTypeColor(type: TaskType): (text: string) => string {
  switch (type) {
    case 'feat':
      return colors.success;
    case 'fix':
      return colors.error;
    case 'refactor':
      return colors.warning;
    case 'docs':
      return colors.info;
    case 'test':
      return colors.secondary;
    case 'chore':
      return colors.normal;
    default:
      return colors.normal;
  }
}
