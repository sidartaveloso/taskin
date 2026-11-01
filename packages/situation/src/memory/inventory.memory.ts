import { pluginKey } from '../system/plugin.types';
import type {
  IInventory,
  InventoryAccess,
  InventoryEvents,
  InventoryPorts,
} from '../system/plugins/inventory/inventory.types';
import type { FactView, Layer, ResourceDeclaration, ResourceView, SituationView } from '../use-cases/actors.types';
import {
  type AccessKind,
  type DataClass,
  type PersonId,
  type RepositoryId,
  type ResourceId,
  resourceId,
} from '../use-cases/branded';
import type { ProbedFacts } from '../use-cases/ports.types';
import { MemoryPlugin } from './plugin.memory';

type ProbeState =
  | { readonly state: 'probed'; readonly facts: ProbedFacts }
  | { readonly state: 'unreachable'; readonly observedAt: number };

interface StoredResource {
  readonly id: ResourceId;
  readonly declaration: ResourceDeclaration;
  readonly layer: Layer;
  /** Na camada da pessoa: a dona. */
  readonly owner?: PersonId;
  /** Na camada do repositorio: o repositorio que oferece. */
  readonly repository?: RepositoryId;
  readonly releasedTo: Set<RepositoryId>;
  probe?: ProbeState;
}

export class UnknownResourceError extends Error {
  constructor(readonly resource: ResourceId) {
    super(`recurso desconhecido: ${resource}`);
    this.name = 'UnknownResourceError';
  }
}

export class NotTheOwnerError extends Error {
  constructor(
    readonly resource: ResourceId,
    readonly person: PersonId,
  ) {
    super(`${person} nao e dona de ${resource}`);
    this.name = 'NotTheOwnerError';
  }
}

class MemoryInventory extends MemoryPlugin<InventoryEvents> implements IInventory {
  readonly key = pluginKey('inventory');
  readonly name = 'Inventory';
  readonly description = 'The two layers of resources, their releases, restrictions and facts';

  private readonly resources = new Map<ResourceId, StoredResource>();
  private readonly restricted = new Set<RepositoryId>();
  private readonly clearances = new Map<string, DataClass>();
  private sequence = 0;

  constructor(private readonly ports: InventoryPorts) {
    super(ports.clock);
  }

  private store(resource: Omit<StoredResource, 'id' | 'releasedTo'>): StoredResource {
    this.sequence += 1;
    const stored: StoredResource = { ...resource, id: resourceId(`resource-${this.sequence}`), releasedTo: new Set() };
    this.resources.set(stored.id, stored);
    return stored;
  }

  private find(id: ResourceId): StoredResource {
    const found = this.resources.get(id);
    if (found === undefined) throw new UnknownResourceError(id);
    return found;
  }

  async declare(owner: PersonId, declaration: ResourceDeclaration): Promise<ResourceId> {
    const stored = this.store({ declaration, layer: 'personal', owner });
    this.emit('inventory:resource-declared', {
      resource: stored.id,
      name: declaration.name,
      kind: declaration.kind,
      owner,
    });
    return stored.id;
  }

  async release(owner: PersonId, resource: ResourceId, repository: RepositoryId): Promise<void> {
    const stored = this.find(resource);
    if (stored.owner !== owner) throw new NotTheOwnerError(resource, owner);
    stored.releasedTo.add(repository);
    this.emit('inventory:resource-released', { resource, owner, repository });
  }

  async offer(repository: RepositoryId, declaration: ResourceDeclaration): Promise<ResourceId> {
    const stored = this.store({ declaration, layer: 'repository', repository });
    this.emit('inventory:resource-offered', {
      resource: stored.id,
      name: declaration.name,
      kind: declaration.kind,
      repository,
    });
    return stored.id;
  }

  async restrictPersonalMachines(repository: RepositoryId): Promise<void> {
    this.restricted.add(repository);
    this.emit('inventory:personal-machines-restricted', { repository });
  }

  async classify(repository: RepositoryId, access: ResourceId, clearance: DataClass): Promise<void> {
    this.find(access);
    this.clearances.set(`${repository}\u0000${access}`, clearance);
    this.emit('inventory:access-classified', { repository, access, clearance });
  }

  async recordProbe(machine: ResourceId, facts: ProbedFacts | undefined): Promise<void> {
    const stored = this.find(machine);
    if (facts === undefined) {
      const observedAt = this.clock.now();
      stored.probe = { state: 'unreachable', observedAt };
      this.emit('inventory:machine-unreachable', { machine, observedAt });
      return;
    }
    stored.probe = { state: 'probed', facts };
    this.emit('inventory:facts-recorded', {
      machine,
      capabilities: facts.capabilities,
      observedAt: facts.observedAt,
    });
  }

  /** O que esta a vista desta pessoa neste repositorio, nas duas camadas. */
  private visible(person: PersonId, repository: RepositoryId): StoredResource[] {
    return [...this.resources.values()].filter((r) => {
      if (r.layer === 'repository') return r.repository === repository;
      if (r.owner !== person || !r.releasedTo.has(repository)) return false;
      return !(r.declaration.kind === 'machine' && this.restricted.has(repository));
    });
  }

  private facts(resource: StoredResource): FactView[] {
    if (resource.declaration.kind !== 'machine') return [];
    const declared: FactView[] = resource.declaration.capabilities.map((capability) => ({
      capability,
      origin: 'declared',
      expired: false,
    }));
    if (resource.probe?.state !== 'probed') return declared;
    const { capabilities, observedAt } = resource.probe.facts;
    const expired = this.clock.now() - observedAt > this.ports.settings.factTtlMs;
    return [
      ...declared,
      ...capabilities.map((capability): FactView => ({ capability, origin: 'probed', observedAt, expired })),
    ];
  }

  private async toView(person: PersonId, resource: StoredResource): Promise<ResourceView> {
    const base = {
      id: resource.id,
      name: resource.declaration.name,
      kind: resource.declaration.kind,
      layer: resource.layer,
      facts: this.facts(resource),
    };
    if (resource.declaration.kind === 'access') {
      const secret = await this.ports.secrets.read(person, resource.declaration.secret);
      if (secret === undefined) {
        return {
          ...base,
          available: false,
          reason: {
            code: 'missing-credential',
            detail: `${person} nao tem na guarda o segredo de ${resource.declaration.name}`,
          },
        };
      }
      return { ...base, available: true };
    }
    if (resource.probe?.state === 'unreachable') {
      return {
        ...base,
        available: false,
        reason: { code: 'unreachable', detail: `${resource.declaration.name} nao respondeu a sondagem` },
      };
    }
    return { ...base, available: true };
  }

  async view(person: PersonId, repository: RepositoryId): Promise<SituationView> {
    const resources: ResourceView[] = [];
    for (const resource of this.visible(person, repository)) resources.push(await this.toView(person, resource));
    return { repository, observedAt: this.clock.now(), resources };
  }

  async machines(person: PersonId, repository: RepositoryId): Promise<readonly ResourceView[]> {
    return (await this.view(person, repository)).resources.filter((r) => r.kind === 'machine');
  }

  async accesses(person: PersonId, repository: RepositoryId, kind: AccessKind): Promise<readonly InventoryAccess[]> {
    const accesses: InventoryAccess[] = [];
    for (const resource of this.visible(person, repository)) {
      const declaration = resource.declaration;
      if (declaration.kind !== 'access' || declaration.accessKind !== kind) continue;
      const clearance =
        this.clearances.get(`${repository}\u0000${resource.id}`) ?? declaration.clearance ?? ('public' as const);
      accesses.push({
        id: resource.id,
        name: declaration.name,
        layer: resource.layer,
        accessKind: declaration.accessKind,
        secret: declaration.secret,
        envVar: declaration.envVar,
        clearance,
        ...(declaration.concurrencyLimit === undefined ? {} : { concurrencyLimit: declaration.concurrencyLimit }),
      });
    }
    return accesses;
  }
}

/** O inventario em memoria. O relogio, a guarda e os prazos vem das portas. */
export function createMemoryInventory(ports: InventoryPorts): IInventory {
  return new MemoryInventory(ports);
}
