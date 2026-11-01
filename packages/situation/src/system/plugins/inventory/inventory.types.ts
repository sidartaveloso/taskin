import type { ResourceDeclaration, ResourceView, SituationView } from '../../../use-cases/actors.types';
import type {
  AccessKind,
  Capability,
  DataClass,
  Instant,
  PersonId,
  RepositoryId,
  ResourceId,
  SecretRef,
} from '../../../use-cases/branded';
import type { ProbedFacts, SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * O inventario: as duas camadas (a do repositorio e a da pessoa), as
 * liberacoes, as restricoes do repositorio e os fatos sobre cada recurso.
 */
export interface IInventory extends IPluginSituation<InventoryEvents> {
  readonly key: PluginKey<'inventory'>;
  /** Um recurso da camada da pessoa. Nao aparece em repositorio nenhum ate ser liberado. */
  declare(owner: PersonId, declaration: ResourceDeclaration): Promise<ResourceId>;
  release(owner: PersonId, resource: ResourceId, repository: RepositoryId): Promise<void>;
  /** Um recurso da camada do repositorio, a vista de todos que trabalham nele. */
  offer(repository: RepositoryId, declaration: ResourceDeclaration): Promise<ResourceId>;
  restrictPersonalMachines(repository: RepositoryId): Promise<void>;
  classify(repository: RepositoryId, access: ResourceId, clearance: DataClass): Promise<void>;
  /** O que a sondagem viu numa maquina, ou `undefined` quando ela nao respondeu. */
  recordProbe(machine: ResourceId, facts: ProbedFacts | undefined): Promise<void>;
  /** O quadro: as duas camadas somadas, para esta pessoa neste repositorio. */
  view(person: PersonId, repository: RepositoryId): Promise<SituationView>;
  /** As maquinas a vista desta pessoa neste repositorio, para quem sonda. */
  machines(person: PersonId, repository: RepositoryId): Promise<readonly ResourceView[]>;
  /**
   * Os acessos de um tipo a vista desta pessoa neste repositorio, com a
   * liberacao que o repositorio deu. So a referencia do segredo, nunca o valor.
   */
  accesses(person: PersonId, repository: RepositoryId, kind: AccessKind): Promise<readonly InventoryAccess[]>;
}

export type InventoryPorts = Pick<SituationPorts, 'clock' | 'secrets' | 'settings'>;

export interface InventoryAccess {
  readonly id: ResourceId;
  readonly name: string;
  readonly layer: 'repository' | 'personal';
  readonly accessKind: AccessKind;
  readonly secret: SecretRef;
  readonly envVar: string;
  /** A liberacao classificada pelo repositorio, ou a declarada; `public` quando nenhuma. */
  readonly clearance: DataClass;
  readonly concurrencyLimit?: number;
}

/** O que o registro de recursos diz de um recurso, sem o segredo: o nome logico e o tipo. */
export interface ResourceIdentity {
  readonly resource: ResourceId;
  readonly name: string;
  readonly kind: ResourceDeclaration['kind'];
}

export type InventoryEvents = {
  readonly 'inventory:resource-declared': ResourceIdentity & { readonly owner: PersonId };
  readonly 'inventory:resource-released': {
    readonly resource: ResourceId;
    readonly owner: PersonId;
    readonly repository: RepositoryId;
  };
  readonly 'inventory:resource-offered': ResourceIdentity & { readonly repository: RepositoryId };
  readonly 'inventory:personal-machines-restricted': { readonly repository: RepositoryId };
  readonly 'inventory:access-classified': {
    readonly repository: RepositoryId;
    readonly access: ResourceId;
    readonly clearance: DataClass;
  };
  readonly 'inventory:facts-recorded': {
    readonly machine: ResourceId;
    readonly capabilities: readonly Capability[];
    readonly observedAt: Instant;
  };
  readonly 'inventory:machine-unreachable': { readonly machine: ResourceId; readonly observedAt: Instant };
};
