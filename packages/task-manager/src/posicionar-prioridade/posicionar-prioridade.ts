import type { Task, TaskId } from '@opentask/taskin-types';
import { numerarPrioridade, PASSO_DE_PRIORIDADE } from '../numerar-prioridade/index.js';
import { ordenarTarefas } from '../ordenar-tarefas/index.js';

/**
 * O maior numero de prioridade aceito.
 *
 * O teto e o do inteiro seguro: acima dele a media entre dois vizinhos, que e
 * como a numeracao por passos abre espaco, deixa de ser exata.
 *
 * @public
 */
export const PRIORIDADE_MAXIMA = Number.MAX_SAFE_INTEGER;

/**
 * Confere um numero de prioridade vindo de fora — uma flag, um argumento de
 * ferramenta — antes de ele chegar a um arquivo.
 *
 * Inteiro e a partir de 1 porque e o que a numeracao sabe manter: ela abre
 * espaco pela media arredondada para baixo, e trata o zero como "antes de
 * tudo", sem numero proprio.
 *
 * @returns O mesmo numero, quando valido
 * @throws Error dizendo a faixa, quando nao
 * @public
 */
export function validarPrioridade(valor: number): number {
  if (!Number.isInteger(valor) || valor < 1 || valor > PRIORIDADE_MAXIMA) {
    throw new Error(`Priority must be a whole number from 1 to ${PRIORIDADE_MAXIMA}; got ${valor}.`);
  }
  return valor;
}

/** De que lado da referencia a tarefa vai parar. @public */
export type LadoDaReferencia = 'before' | 'after';

/**
 * Coloca uma tarefa imediatamente antes ou depois de outra, e devolve so o que
 * precisa ser gravado.
 *
 * Existe porque, na pratica, ninguem sabe que numero quer — sabe que quer isto
 * **antes daquilo**.
 *
 * A regra de numeracao nao e reescrita aqui: a tarefa sai da fila, volta sem
 * numero no ponto pedido, e {@link numerarPrioridade} faz o resto — o meio do
 * espaco quando ha espaco, a renumeracao da vizinhanca quando nao ha.
 *
 * As tarefas **sem numero depois do ponto de insercao** ficam de fora da
 * passada. Elas ja ordenam por ultimo, e numera-las transformaria um movimento
 * num `prioritize` inteiro — justamente o custo que a task-084 eliminou.
 *
 * @param tarefas - Todas as tarefas, em qualquer ordem
 * @returns Copias apenas das tarefas que mudaram, a movida entre elas
 * @throws Error quando a referencia nao existe, ou e a propria tarefa
 * @public
 */
export function posicionarPrioridade<TTask extends Task>(
  tarefas: readonly TTask[],
  taskId: TaskId,
  referenciaId: TaskId,
  lado: LadoDaReferencia,
  passo = PASSO_DE_PRIORIDADE,
): TTask[] {
  if (taskId === referenciaId) {
    throw new Error(`Task '${taskId}' cannot be placed ${lado} itself.`);
  }

  const movida = tarefas.find((t) => t.id === taskId);
  if (!movida) throw new Error(`Task with ID '${taskId}' not found.`);
  if (!tarefas.some((t) => t.id === referenciaId)) {
    throw new Error(`Task with ID '${referenciaId}' not found.`);
  }

  const fila = ordenarTarefas(tarefas.filter((t) => t.id !== taskId));
  const indice = fila.findIndex((t) => t.id === referenciaId) + (lado === 'after' ? 1 : 0);

  const antes = fila.slice(0, indice);
  const depois = fila.slice(indice).filter((t) => t.order !== undefined);
  const semNumero = { ...movida, order: undefined };

  return numerarPrioridade([...antes, semNumero, ...depois], passo) as TTask[];
}

/** Qual ponta da fila. @public */
export type ExtremoDaFila = 'top' | 'bottom';

/**
 * Leva uma tarefa ao topo ou ao fim, e devolve so o que precisa ser gravado.
 *
 * A mesma semantica dos botoes do dashboard (task-101): uma tarefa **agrupada**
 * vai ao extremo do proprio grupo, e uma solta ao extremo da fila inteira. Por
 * baixo e {@link posicionarPrioridade} com a referencia calculada — antes da
 * primeira irma, ou depois da ultima —, e herda dela o custo: topo grava um
 * arquivo; fim, depois de uma cauda sem numero, numera a cauda uma vez.
 *
 * @returns Vazio quando a tarefa ja esta no extremo pedido
 * @throws Error quando a tarefa nao existe
 * @public
 */
export function posicionarNoExtremo<TTask extends Task>(
  tarefas: readonly TTask[],
  taskId: TaskId,
  extremo: ExtremoDaFila,
  passo = PASSO_DE_PRIORIDADE,
): TTask[] {
  const movida = tarefas.find((t) => t.id === taskId);
  if (!movida) throw new Error(`Task with ID '${taskId}' not found.`);

  /*
   * Uma solta disputa o extremo com a fila inteira, grupos inclusive: o grupo
   * ocupa o lugar do seu primeiro membro, entao passar do primeiro (ou do
   * ultimo) numero de todos e passar de todo no de fora.
   */
  const irmas = ordenarTarefas(
    movida.groupId === undefined ? tarefas : tarefas.filter((t) => t.groupId === movida.groupId),
  );
  const referencia = extremo === 'top' ? irmas[0] : irmas.at(-1);
  if (!referencia || referencia.id === taskId) return [];

  return posicionarPrioridade(tarefas, taskId, referencia.id, extremo === 'top' ? 'before' : 'after', passo);
}
