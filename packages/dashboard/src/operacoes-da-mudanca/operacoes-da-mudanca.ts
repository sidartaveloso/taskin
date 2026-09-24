import type { OperacaoDoQuadro } from '@opentask/taskin-task-provider-pinia';

/**
 * O nome de um grupo criado no quadro. O quadro agrupa arrastando, sem pedir
 * nome; o registro exige um. Renomear e pela CLI (`taskin group rename`).
 */
export const NOME_DE_GRUPO_NOVO = 'Novo grupo';

/** Os campos de priorizacao de uma tarefa, como o quadro os ve. */
export interface CamposDoQuadro {
  order?: number;
  groupId?: string;
  difficulty?: number;
}

/**
 * Traduz o que o quadro de priorizacao mudou numa tarefa nas operacoes
 * nomeadas do `ITaskManager` — as mesmas que a CLI e o MCP chamam.
 *
 * Ate a task-106 o dashboard mandava a tarefa inteira num `update` generico, e
 * por isso agrupar, priorizar e pontuar existiam so aqui. O quadro continua
 * calculando a mudanca (com desfazer e refazer); o que muda e o que vai pelo
 * fio.
 *
 * Grupo vai antes de prioridade para a tarefa nunca ficar, nem por um momento,
 * com o numero novo no grupo velho.
 *
 * @param gruposConhecidos - Os grupos que o registro ja tem, por id. Um id fora
 *   dele foi inventado pelo quadro e e criado antes de atribuir.
 */
export function operacoesDaMudanca(
  original: CamposDoQuadro & { id: string },
  mudada: CamposDoQuadro,
  gruposConhecidos: Readonly<Record<string, string>>,
): OperacaoDoQuadro[] {
  const taskId = original.id;
  const ops: OperacaoDoQuadro[] = [];

  if (mudada.groupId !== original.groupId) {
    if (mudada.groupId === undefined) {
      ops.push({ type: 'remove-from-group', payload: { taskId } });
    } else {
      if (!(mudada.groupId in gruposConhecidos)) {
        ops.push({ type: 'create-group', payload: { id: mudada.groupId, name: NOME_DE_GRUPO_NOVO } });
      }
      ops.push({ type: 'assign-to-group', payload: { taskId, groupId: mudada.groupId } });
    }
  }

  if (mudada.order !== undefined && mudada.order !== original.order) {
    ops.push({ type: 'set-priority', payload: { taskId, priority: mudada.order } });
  }

  if (mudada.difficulty !== undefined && mudada.difficulty !== original.difficulty) {
    ops.push({ type: 'set-difficulty', payload: { taskId, difficulty: mudada.difficulty } });
  }

  return ops;
}
