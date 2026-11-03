import type {
  AccessKind,
  DataClass,
  PersonId,
  RepositoryId,
  ResourceId,
  SecretRef,
  TaskRef,
} from '../../../use-cases/branded';
import type {
  AccessGrant,
  LeaseDenied,
  LeaseExpired,
  LeaseGranted,
  LeaseRequest,
  LeaseReturned,
  RunStarted,
} from '../../../use-cases/flows.types';
import type { SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * O access broker: quem executa pede um acesso pelo tipo, e recebe a conta
 * liberada para a sensibilidade do dado, com folga na cota e, entre as que
 * sobram, a menos ocupada, com o segredo so no ambiente daquela execucao.
 *
 * So o acesso que declara capacidade (`concurrencyLimit`) tem reserva: ocupa
 * uma vaga, com prazo e devolucao. Sem capacidade declarada nada e gravado.
 */
export interface IAccessBroker extends IPluginSituation<AccessBrokerEvents> {
  readonly key: PluginKey<'access-broker'>;
  requestLease(person: PersonId, request: LeaseRequest): Promise<AccessGrant | LeaseDenied>;
  /** Devolve a vaga de uma reserva. Um acesso sem reserva nao tem o que devolver, e o tipo nao deixa tentar. */
  returnLease(lease: LeaseGranted): Promise<LeaseReturned | LeaseExpired>;
  /** As reservas em curso, sem o segredo. As vencidas ja nao aparecem. */
  leases(): Promise<readonly ActiveLease[]>;
}

/**
 * Um acesso que o broker pode entregar: o que o inventario sabe dele, sem o
 * segredo. Com `concurrencyLimit` ele e reservado; sem, e so entregue.
 */
export interface LendableAccess {
  readonly id: ResourceId;
  readonly name: string;
  readonly accessKind: AccessKind;
  readonly secret: SecretRef;
  readonly envVar: string;
  readonly clearance: DataClass;
  readonly concurrencyLimit?: number;
}

/** De onde vem a lista de acessos. No sistema, quem responde e o inventario. */
export interface IAccessCatalogPort {
  accesses(person: PersonId, repository: RepositoryId, kind: AccessKind): Promise<readonly LendableAccess[]>;
}

/**
 * De onde vem a ocupacao de cada conta: as execucoes que comecaram e nao
 * terminaram. No sistema, quem responde e o registro de execucoes.
 */
export interface IOpenRunsPort {
  openRuns(): Promise<readonly RunStarted[]>;
}

export type AccessBrokerPorts = Pick<SituationPorts, 'clock' | 'secrets' | 'usage' | 'settings'> & {
  readonly catalog: IAccessCatalogPort;
  readonly runs: IOpenRunsPort;
};

export type ActiveLease = Omit<LeaseGranted, 'env'> & {
  readonly person: PersonId;
  readonly repository: RepositoryId;
  readonly task: TaskRef;
};

/** Os eventos nunca levam o ambiente da reserva: o segredo vive so no `LeaseGranted`. */
export type AccessBrokerEvents = {
  readonly 'access-broker:lease-granted': Omit<ActiveLease, 'state'>;
  readonly 'access-broker:lease-denied': {
    readonly person: PersonId;
    readonly repository: RepositoryId;
    readonly task: TaskRef;
    readonly kind: AccessKind;
    readonly reason: LeaseDenied['reason'];
  };
  readonly 'access-broker:lease-returned': { readonly lease: LeaseGranted['id']; readonly access: ResourceId };
  readonly 'access-broker:lease-expired': { readonly lease: LeaseGranted['id']; readonly access: ResourceId };
};
