/**
 * `taskin priority` — dar a uma tarefa o seu lugar na fila.
 */

import { PRIORIDADE_MAXIMA, TaskManager, validarPrioridade } from '@opentask/taskin-task-manager';
import type { TaskId } from '@opentask/taskin-types';
import { error, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { normalizeTaskId } from '../lib/task-id.js';
import { defineCommand } from './define-command/index.js';

interface PriorityOptions {
  before?: string;
  after?: string;
}

/**
 * O numero digitado, conferido antes de chegar a um arquivo.
 *
 * `Number` e nao `parseInt`: `parseInt('2.5')` vira 2 e `parseInt('10abc')`
 * vira 10, e as duas coisas passariam caladas.
 *
 * @throws Error dizendo a faixa, quando o texto nao e um numero valido
 */
export function lerPrioridade(texto: string): number {
  const valor = texto.trim() === '' ? Number.NaN : Number(texto);
  if (Number.isNaN(valor)) {
    // A frase do dominio, mas com o que a pessoa digitou no lugar de `NaN`.
    throw new Error(`Priority must be a whole number from 1 to ${PRIORIDADE_MAXIMA}; got "${texto}".`);
  }
  return validarPrioridade(valor);
}

/** O id digitado, ou a saida com a mesma frase que `start` e `finish` usam. */
export function exigirTaskId(texto: string): TaskId {
  const id = normalizeTaskId(texto);
  if (!id) {
    error(`'${texto}' is not a task id. Expected something like 020 or task-020.`);
    process.exit(1);
  }
  return id;
}

/**
 * Uma forma so por chamada. `--before` e `--after` existem porque, na pratica,
 * ninguem sabe que numero quer — sabe que quer isto antes daquilo.
 */
export const priorityCommand = defineCommand({
  name: 'priority <task-id> [priority]',
  description: '🔝 Set where a task sits in the queue: a number, or before/after another task',
  options: [
    { flags: '--before <task-id>', description: 'Place the task right before this one' },
    { flags: '--after <task-id>', description: 'Place the task right after this one' },
  ],
  handler: async (taskId: string, priority: string | undefined, options: PriorityOptions) => {
    await definirPrioridade(taskId, priority, options);
  },
});

async function definirPrioridade(
  taskIdTexto: string,
  prioridadeTexto: string | undefined,
  options: PriorityOptions,
): Promise<void> {
  requireTaskinProject();

  const formas = [prioridadeTexto, options.before, options.after].filter((f) => f !== undefined);
  if (formas.length !== 1) {
    error('Pass exactly one of: a priority number, --before <task-id> or --after <task-id>.');
    process.exit(1);
  }

  const taskId = exigirTaskId(taskIdTexto);
  const { provider } = await resolveTaskProvider();
  const manager = new TaskManager(provider);

  try {
    if (prioridadeTexto !== undefined) {
      const task = await manager.setPriority(taskId, lerPrioridade(prioridadeTexto));
      success(`Task ${taskId} now has priority ${task.order}.`);
      return;
    }

    const referencia = exigirTaskId(options.before ?? options.after ?? '');
    const { task, changed } = options.before
      ? await manager.moveBefore(taskId, referencia)
      : await manager.moveAfter(taskId, referencia);

    success(
      `Task ${taskId} is now ${options.before ? 'before' : 'after'} ${referencia} (priority ${task.order}) — ${changed} task file(s) written.`,
    );
  } catch (falha) {
    error(falha instanceof Error ? falha.message : String(falha));
    process.exit(1);
  }
}
