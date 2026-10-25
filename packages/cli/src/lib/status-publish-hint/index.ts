/**
 * Fora do autopilot o status nao e publicado sozinho (task-205). Depois de
 * mudar o status, a CLI ensina a publicar so a task — e quem sabe quais
 * caminhos ela ocupa e o provider, nao a CLI.
 */

import type { IGitService } from '@opentask/taskin-git-utils';
import type { ITaskProvider } from '@opentask/taskin-task-manager';
import type { AutomationLevel, TaskId } from '@opentask/taskin-types';
import type { OpaqueTask } from '../provider-factory/index.js';

/**
 * O que e preciso para montar a dica.
 */
export interface StatusPublishHintContext {
  provider: ITaskProvider<OpaqueTask>;
  git: IGitService;
  level: AutomationLevel;
  taskId: TaskId;
  /** A mensagem do commit de status */
  message: string;
  /** O commit de status ja aconteceu; falta so o push */
  committed: boolean;
}

/**
 * O comando que publica so a task, ou `undefined` em autopilot e quando o
 * provider nao tem o conceito.
 *
 * O push vai para a branch corrente: empurrar `HEAD` de uma branch de feature
 * para a `defaultBranch` levaria a feature inteira junto.
 */
export async function statusPublishHint(context: StatusPublishHintContext): Promise<string | undefined> {
  if (context.level === 'autopilot' || !context.provider.describePublish) return undefined;

  const branch = (await context.git.getCurrentBranch()) || undefined;
  const hint = await context.provider.describePublish(context.taskId, {
    message: context.message,
    branch,
    committed: context.committed,
  });

  return hint?.command;
}
