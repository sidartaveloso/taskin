/**
 * `taskin difficulty` — pontuar uma tarefa sem abrir o arquivo.
 */

import { DIFICULDADE_MAXIMA, DIFICULDADE_MINIMA, TaskManager, validarDificuldade } from '@opentask/taskin-task-manager';
import { error, success } from '../lib/colors.js';
import { requireTaskinProject } from '../lib/project-check.js';
import { resolveTaskProvider } from '../lib/provider-factory/index.js';
import { defineCommand } from './define-command/index.js';
import { exigirTaskId } from './priority.js';

/**
 * O numero digitado, conferido antes de chegar a um arquivo — pelo mesmo
 * motivo de `lerPrioridade`: `parseInt('2.5')` viraria 2 calado.
 *
 * @throws Error dizendo a faixa, quando o texto nao e uma dificuldade valida
 */
export function lerDificuldade(texto: string): number {
  const valor = texto.trim() === '' ? Number.NaN : Number(texto);
  if (Number.isNaN(valor)) {
    // A frase do dominio, mas com o que a pessoa digitou no lugar de `NaN`.
    throw new Error(
      `Invalid difficulty: "${texto}". Use a whole number from ${DIFICULDADE_MINIMA} to ${DIFICULDADE_MAXIMA}.`,
    );
  }
  return validarDificuldade(valor);
}

/**
 * Nao ha forma de tirar a dificuldade: `setDifficulty` so grava de 1 a 5, e o
 * quadro tambem so troca um valor por outro. Pontuar errado se corrige
 * pontuando de novo.
 */
export const difficultyCommand = defineCommand({
  name: 'difficulty <task-id> <difficulty>',
  description: `🎯 Score how hard a task is, from ${DIFICULDADE_MINIMA} (trivial) to ${DIFICULDADE_MAXIMA} (very hard)`,
  handler: async (taskId: string, dificuldade: string) => {
    await pontuar(taskId, dificuldade);
  },
});

async function pontuar(taskIdTexto: string, dificuldadeTexto: string): Promise<void> {
  requireTaskinProject();

  const taskId = exigirTaskId(taskIdTexto);
  try {
    const difficulty = lerDificuldade(dificuldadeTexto);
    const { provider } = await resolveTaskProvider();
    const task = await new TaskManager(provider).setDifficulty(taskId, difficulty);
    success(`Task ${taskId} now has difficulty ${task.difficulty}.`);
  } catch (falha) {
    error(falha instanceof Error ? falha.message : String(falha));
    process.exit(1);
  }
}
