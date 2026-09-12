import type { GroupId, TaskId, TaskStatus, TaskType } from '@opentask/taskin-types';

/**
 * O que restringe uma listagem de tarefas.
 *
 * Todos os campos sao opcionais e **se somam**: informar dois exige os dois.
 * Um criterio ausente nao restringe nada.
 *
 * @public
 */
export interface TaskFilterCriteria {
  /** Status exato. */
  readonly status?: TaskStatus;
  /** Tipo exato. */
  readonly type?: TaskType;
  /**
   * Responsavel, casado por id ou nome — inteiro ou em parte, sem distinguir
   * maiuscula. Tarefa sem responsavel nunca casa.
   */
  readonly assignee?: string;
  /** Apenas o que ainda esta em aberto. Ignorado quando `status` e informado. */
  readonly open?: boolean;
  /** Apenas o que foi encerrado. Ignorado quando `status` e informado. */
  readonly closed?: boolean;
  /** Busca livre em id, titulo, status e responsavel. */
  readonly text?: string;
}

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
