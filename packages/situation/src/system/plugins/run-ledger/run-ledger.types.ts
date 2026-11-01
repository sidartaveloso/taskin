import type { Difficulty, Instant, RepositoryId, ResourceId, TaskRef, TokenCount } from '../../../use-cases/branded';
import type {
  RunFinished,
  RunOutcome,
  RunPlanned,
  RunStarted,
  ViewpointDelivered,
} from '../../../use-cases/flows.types';
import type { SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * O registro de execucao: a dificuldade estimada e a encontrada, o consumo, e
 * os pontos de vista que cada execucao recebeu. Cita o acesso so pelo id do
 * recurso: o registro nunca ve o segredo.
 */
export interface IRunLedger extends IPluginSituation<RunLedgerEvents> {
  readonly key: PluginKey<'run-ledger'>;
  planRun(repository: RepositoryId, task: TaskRef, estimated: Difficulty): Promise<RunPlanned>;
  /** Comeca com o acesso emprestado: o id, nunca o emprestimo com o ambiente. */
  startRun(run: RunPlanned, access: ResourceId): Promise<RunStarted>;
  finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished>;
  /** As execucoes fechadas no repositorio, na ordem em que fecharam. */
  runs(repository: RepositoryId): Promise<readonly RunFinished[]>;
  /** Os tokens das execucoes fechadas neste acesso desde um instante: a base da projecao de cota. */
  consumption(access: ResourceId, since: Instant): Promise<TokenCount>;
  recordViewpoint(viewpoint: ViewpointDelivered): Promise<void>;
  viewpoints(repository: RepositoryId, task: TaskRef): Promise<readonly ViewpointDelivered[]>;
}

export type RunLedgerPorts = Pick<SituationPorts, 'clock'>;

export type RunLedgerEvents = {
  readonly 'run-ledger:run-planned': Omit<RunPlanned, 'state'>;
  readonly 'run-ledger:run-started': Omit<RunStarted, 'state'>;
  readonly 'run-ledger:run-finished': Omit<RunFinished, 'state'>;
  readonly 'run-ledger:viewpoint-recorded': Omit<ViewpointDelivered, 'state'>;
};
