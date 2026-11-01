import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { MemoryInventory } from '../memory/inventory.memory';
import type { IInventory, InventoryPorts } from '../system/plugins/inventory/inventory.types';
import type { ResourceDeclaration } from '../use-cases/actors.types';
import type { DataClass, PersonId, RepositoryId, ResourceId } from '../use-cases/branded';

/** Onde as duas camadas moram. Injetados: nos testes, uma pasta temporaria. */
export interface LocalInventoryPaths {
  /** O `.taskin.json` do repositorio: a camada versionada vive na chave `resources`. */
  readonly repositoryConfig: string;
  /** `~/.config/taskin/resources.json`: a camada da pessoa, fora do repositorio. */
  readonly personalResources: string;
}

export interface LocalInventoryOptions extends LocalInventoryPaths {
  /** O repositorio a que a camada do `.taskin.json` pertence. */
  readonly repository: RepositoryId;
}

interface RepositoryLayer {
  offers: ResourceDeclaration[];
  restrictPersonalMachines: boolean;
  /** Liberacao classificada pelo repositorio, pelo nome logico do acesso. */
  clearances: Record<string, DataClass>;
}

interface PersonalEntry {
  declaration: ResourceDeclaration;
  releasedTo: RepositoryId[];
}

type PersonalLayer = Record<string, PersonalEntry[]>;

function readJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * O inventario em arquivo: a mesma logica do em memoria, com o estado das duas
 * camadas relido dos arquivos ao criar e regravado a cada mudanca. O
 * repositorio guarda so nomes logicos e capacidades; a referencia do segredo
 * guarda o nome, nunca o valor.
 */
class LocalInventory extends MemoryInventory {
  private readonly repositoryLayer: RepositoryLayer;
  private readonly personalLayer: PersonalLayer;
  private readonly entries = new Map<ResourceId, PersonalEntry>();
  private readonly offered = new Map<ResourceId, ResourceDeclaration>();
  private readonly loaded: Promise<void>;

  constructor(
    ports: InventoryPorts,
    private readonly options: LocalInventoryOptions,
  ) {
    super(ports);
    const stored = readJson(options.repositoryConfig).resources as Partial<RepositoryLayer> | undefined;
    this.repositoryLayer = {
      offers: [...(stored?.offers ?? [])],
      restrictPersonalMachines: stored?.restrictPersonalMachines ?? false,
      clearances: { ...stored?.clearances },
    };
    this.personalLayer = readJson(options.personalResources) as PersonalLayer;
    this.loaded = this.replay();
  }

  private async replay(): Promise<void> {
    const { repository } = this.options;
    for (const declaration of this.repositoryLayer.offers) {
      this.offered.set(await super.offer(repository, declaration), declaration);
    }
    if (this.repositoryLayer.restrictPersonalMachines) await super.restrictPersonalMachines(repository);
    for (const [name, clearance] of Object.entries(this.repositoryLayer.clearances)) {
      const id = [...this.offered].find(([, d]) => d.name === name)?.[0];
      if (id !== undefined) await super.classify(repository, id, clearance);
    }
    for (const [owner, entries] of Object.entries(this.personalLayer)) {
      for (const entry of entries) {
        const id = await super.declare(owner as PersonId, entry.declaration);
        this.entries.set(id, entry);
        for (const released of entry.releasedTo) await super.release(owner as PersonId, id, released);
      }
    }
  }

  private saveRepository(): void {
    const config = readJson(this.options.repositoryConfig);
    writeJson(this.options.repositoryConfig, { ...config, resources: this.repositoryLayer });
  }

  private savePersonal(): void {
    writeJson(this.options.personalResources, this.personalLayer);
  }

  override async declare(owner: PersonId, declaration: ResourceDeclaration): Promise<ResourceId> {
    await this.loaded;
    const id = await super.declare(owner, declaration);
    const entry: PersonalEntry = { declaration, releasedTo: [] };
    this.entries.set(id, entry);
    const own = this.personalLayer[owner] ?? [];
    own.push(entry);
    this.personalLayer[owner] = own;
    this.savePersonal();
    return id;
  }

  override async release(owner: PersonId, resource: ResourceId, repository: RepositoryId): Promise<void> {
    await this.loaded;
    await super.release(owner, resource, repository);
    const entry = this.entries.get(resource);
    if (entry !== undefined && !entry.releasedTo.includes(repository)) entry.releasedTo.push(repository);
    this.savePersonal();
  }

  override async offer(repository: RepositoryId, declaration: ResourceDeclaration): Promise<ResourceId> {
    await this.loaded;
    const id = await super.offer(repository, declaration);
    this.offered.set(id, declaration);
    this.repositoryLayer.offers.push(declaration);
    this.saveRepository();
    return id;
  }

  override async restrictPersonalMachines(repository: RepositoryId): Promise<void> {
    await this.loaded;
    await super.restrictPersonalMachines(repository);
    this.repositoryLayer.restrictPersonalMachines = true;
    this.saveRepository();
  }

  override async classify(repository: RepositoryId, access: ResourceId, clearance: DataClass): Promise<void> {
    await this.loaded;
    await super.classify(repository, access, clearance);
    const declaration = this.offered.get(access);
    if (declaration !== undefined) {
      this.repositoryLayer.clearances[declaration.name] = clearance;
      this.saveRepository();
    }
  }

  override async recordProbe(...args: Parameters<IInventory['recordProbe']>): Promise<void> {
    await this.loaded;
    return super.recordProbe(...args);
  }

  override async view(...args: Parameters<IInventory['view']>): ReturnType<IInventory['view']> {
    await this.loaded;
    return super.view(...args);
  }

  override async machines(...args: Parameters<IInventory['machines']>): ReturnType<IInventory['machines']> {
    await this.loaded;
    return super.machines(...args);
  }

  override async accesses(...args: Parameters<IInventory['accesses']>): ReturnType<IInventory['accesses']> {
    await this.loaded;
    return super.accesses(...args);
  }
}

export function createLocalInventory(ports: InventoryPorts, options: LocalInventoryOptions): IInventory {
  return new LocalInventory(ports, options);
}
