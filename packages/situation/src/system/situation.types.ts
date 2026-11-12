import type { SituationPorts } from '../use-cases/ports.types';
import type { EnvelopeOf, EnvelopesOf, EventHandler, EventType } from './envelope';
import type { PluginOperations } from './plugin.types';
import type { AccessBrokerEvents, IAccessBroker } from './plugins/access-broker/access-broker.types';
import type { ChannelsEvents, IChannelSenderPort, IChannels } from './plugins/channels/channels.types';
import type { FlowsEvents, IFlows } from './plugins/flows/flows.types';
import type { IInventory, InventoryEvents } from './plugins/inventory/inventory.types';
import type { IPeople, PeopleEvents } from './plugins/people/people.types';
import type { ICalibrationRunnerPort, IProbe, ProbeEvents } from './plugins/probe/probe.types';
import type { IRunLedger, RunLedgerEvents } from './plugins/run-ledger/run-ledger.types';
import type { IScheduler, SchedulerEvents } from './plugins/scheduler/scheduler.types';

/**
 * O sistema: os plugins somados, ligados entre si pelas portas e pelo `flows`.
 *
 * As ligacoes que o sistema faz, e que a suite das jornadas confere:
 *
 * - o `access-broker` le os acessos do `inventory` (a porta `catalog`);
 * - `probe:machine-probed` e `probe:machine-unreachable` → `inventory.recordProbe`;
 * - `people:viewpoint-requested` → `channels.notify` para quem vai revisar;
 * - `people:viewpoint-delivered` → `run-ledger.recordViewpoint`.
 */
export interface ISituation {
  readonly inventory: PluginOperations<IInventory>;
  readonly probe: PluginOperations<IProbe>;
  readonly accessBroker: PluginOperations<IAccessBroker>;
  readonly runLedger: PluginOperations<IRunLedger>;
  readonly scheduler: PluginOperations<IScheduler>;
  readonly channels: PluginOperations<IChannels>;
  readonly people: PluginOperations<IPeople>;
  readonly flows: PluginOperations<IFlows<SituationEventMap>>;
  /** Ligado quando todos os plugins estao ligados. */
  readonly running: boolean;
  /** Liga todos os plugins e as regras do sistema. */
  start(): Promise<void>;
  stop(): Promise<void>;
  on<TType extends SituationEventType>(type: TType, handler: EventHandler<EnvelopeOf<SituationEventMap, TType>>): void;
  off<TType extends SituationEventType>(type: TType, handler: EventHandler<EnvelopeOf<SituationEventMap, TType>>): void;
}

/** O mapa de todos os eventos do sistema: os mapas dos plugins somados. Nenhum tipo se repete, pela chave. */
export type SituationEventMap = InventoryEvents &
  ProbeEvents &
  AccessBrokerEvents &
  RunLedgerEvents &
  SchedulerEvents &
  ChannelsEvents &
  PeopleEvents &
  FlowsEvents;

export type SituationEventType = keyof SituationEventMap & EventType;

export type SituationEvent = EnvelopesOf<SituationEventMap>;

/** O que vem de fora do sistema: as portas do nivel 1, mais a calibracao e o envio de avisos. */
export interface SystemPorts extends SituationPorts {
  readonly calibration: ICalibrationRunnerPort;
  readonly sender: IChannelSenderPort;
}

export type CreateSystem = (ports: SystemPorts) => ISituation;
