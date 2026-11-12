import type { Difficulty, Instant, RepositoryId, ResourceId, TaskRef, TokenCount } from '../../../use-cases/branded';
import type {
  OpenRun,
  RunAbandoned,
  RunFinished,
  RunOutcome,
  RunPlanned,
  RunRecord,
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
  /** Comeca com o acesso entregue: o id, nunca o acesso com o ambiente. */
  startRun(run: RunPlanned, access: ResourceId): Promise<RunStarted>;
  finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished>;
  /**
   * Fecha sem resultado a execucao cujo comando morreu ou nao disse o que
   * aconteceu: ela deixa de estar em aberto, e so isso. Nada vai ao historico
   * do time, que so calibra com o que foi dito, nem ao consumo da conta.
   */
  abandonRun(run: RunStarted): Promise<RunAbandoned>;
  /**
   * As execucoes que comecaram e ainda nao terminaram nesta maquina, de
   * qualquer repositorio, na ordem em que comecaram: e como o access broker
   * sabe quanto cada conta esta ocupada.
   */
  openRuns(): Promise<readonly OpenRun[]>;
  /**
   * As execucoes fechadas no repositorio, na ordem em que fecharam, so com o
   * que e do time: sem a conta e sem horario (o historico que se versiona).
   */
  runs(repository: RepositoryId): Promise<readonly RunRecord[]>;
  /**
   * Os tokens das execucoes fechadas neste acesso desde um instante, em todos
   * os repositorios desta maquina: a base da projecao de cota. Fica so na maquina.
   */
  consumption(access: ResourceId, since: Instant): Promise<TokenCount>;
  recordViewpoint(viewpoint: ViewpointDelivered): Promise<void>;
  viewpoints(repository: RepositoryId, task: TaskRef): Promise<readonly ViewpointDelivered[]>;
}

export type RunLedgerPorts = Pick<SituationPorts, 'clock'>;

export type RunLedgerEvents = {
  readonly 'run-ledger:run-planned': Omit<RunPlanned, 'state'>;
  readonly 'run-ledger:run-started': Omit<RunStarted, 'state'>;
  readonly 'run-ledger:run-finished': Omit<RunFinished, 'state'>;
  readonly 'run-ledger:run-abandoned': Omit<RunAbandoned, 'state'>;
  readonly 'run-ledger:viewpoint-recorded': Omit<ViewpointDelivered, 'state'>;
};
