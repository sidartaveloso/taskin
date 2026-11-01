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
  LeaseDenied,
  LeaseExpired,
  LeaseGranted,
  LeaseRequest,
  LeaseReturned,
} from '../../../use-cases/flows.types';
import type { SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * O emprestimo de credenciais: quem executa pede um acesso pelo tipo, e recebe
 * a conta com mais folga, com o segredo so no ambiente daquela execucao.
 */
export interface IAccessBroker extends IPluginSituation<AccessBrokerEvents> {
  readonly key: PluginKey<'access-broker'>;
  requestLease(person: PersonId, request: LeaseRequest): Promise<LeaseGranted | LeaseDenied>;
  returnLease(lease: LeaseGranted): Promise<LeaseReturned | LeaseExpired>;
  /** Os emprestimos em curso, sem o segredo. Os vencidos ja nao aparecem. */
  leases(): Promise<readonly ActiveLease[]>;
}

/** Um acesso que pode ser emprestado: o que o inventario sabe dele, sem o segredo. */
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

export type AccessBrokerPorts = Pick<SituationPorts, 'clock' | 'secrets' | 'usage' | 'settings'> & {
  readonly catalog: IAccessCatalogPort;
};

export type ActiveLease = Omit<LeaseGranted, 'env'> & {
  readonly person: PersonId;
  readonly repository: RepositoryId;
  readonly task: TaskRef;
};

/** Os eventos nunca levam o ambiente do emprestimo: o segredo vive so no `LeaseGranted`. */
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
