import type { GroupId, TaskId, TaskStatus, TaskType } from '@opentask/taskin-types';

/**
 * O que restringe uma listagem de tarefas — derivado do schema unico.
 *
 * Vive em `filter-criteria.ts`, onde os criterios sao definidos uma vez so e as
 * superficies (CLI e MCP) derivam. Reexportado aqui para nao mudar os imports
 * existentes.
 */
export type { TaskFilterCriteria } from './filter-criteria.js';

/**
 * A forma de uma tarefa numa listagem — o que identifica, nao o que ela diz.
 *
 * @public
 */
export interface TaskSummary {
  readonly id: TaskId;
  readonly title: string;
  readonly status: TaskStatus;
  readonly type: TaskType;
  readonly assignee?: { readonly id: string; readonly name: string };
  readonly priority?: number;
  readonly groupId?: GroupId;
  readonly groupName?: string;
  readonly difficulty?: number;
}
