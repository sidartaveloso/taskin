import {
  capability,
  createEnvSecretStore,
  createLocalInventory,
  createLocalMachineProbe,
  type FactView,
  type IInventory,
  instant,
  type LocalInventoryPaths,
  type PersonId,
  personId,
  type RepositoryId,
  repositoryId,
  resourceId,
  type SituationView,
} from '@opentask/taskin-situation';
import os from 'os';
import path from 'path';
import { repositoryIdentityOf, warnOnce } from './repository-identity.js';

const FACT_TTL_MS = 24 * 60 * 60 * 1000;
/** O id desta maquina no inventario local. */
export const THIS_MACHINE = 'this-machine';

export interface ProbedSituation {
  readonly inventory: IInventory;
  readonly person: PersonId;
  /** O id de confianca: o que o inventario, as liberacoes e as aprovacoes usam. Nao vai a arquivo versionado. */
  readonly repository: RepositoryId;
  /** O id do historico: o que o `.taskin/runs.jsonl` e os relatorios usam. */
  readonly historyRepository: RepositoryId;
  readonly paths: LocalInventoryPaths;
  /** O quadro com esta maquina sondada. */
  readonly view: SituationView;
}

/** A situacao do repositorio em `root` com esta maquina sondada: usada pelo `status` e pelo `list --where`. */
export async function probeSituation(root: string): Promise<SituationView> {
  return (await probeLocalSituation(root)).view;
}

/** O inventario local e o quadro com esta maquina sondada: o `plan` precisa dos dois. */
export type LocalInventory = Omit<ProbedSituation, 'view'>;

/** O inventario das duas camadas do repositorio em `root`, para a pessoa desta sessao, sem sondar nada. */
export function openLocalInventory(root: string): LocalInventory {
  const clock = { now: () => instant(Date.now()) };

  const paths: LocalInventoryPaths = {
    repositoryConfig: path.join(root, '.taskin.json'),
    personalResources: path.join(os.homedir(), '.config', 'taskin', 'resources.json'),
  };
  const identity = repositoryIdentityOf(root, paths.repositoryConfig, paths.personalResources);
  warnOnce(identity.warnings);
  const repository = repositoryId(identity.trustId);
  const inventory = createLocalInventory(
    { clock, secrets: createEnvSecretStore(), settings: { leaseTtlMs: 60 * 60 * 1000, factTtlMs: FACT_TTL_MS } },
    { repository, ...paths },
  );
  return {
    inventory,
    person: personId(os.userInfo().username),
    repository,
    historyRepository: repositoryId(identity.id),
    paths,
  };
}

export async function probeLocalSituation(root: string): Promise<ProbedSituation> {
  const clock = { now: () => instant(Date.now()) };
  const { inventory, person, repository, historyRepository, paths } = openLocalInventory(root);
  const view = await inventory.view(person, repository);

  const probed = await createLocalMachineProbe({
    clock,
    machine: resourceId(THIS_MACHINE),
    sandcastleImage: 'sandcastle:taskin',
  }).probe(resourceId(THIS_MACHINE));
  const facts: FactView[] = (probed?.capabilities ?? []).map((c) => ({
    capability: capability(c),
    origin: 'probed',
    observedAt: probed?.observedAt,
    expired: false,
  }));

  const withThisMachine: SituationView = {
    ...view,
    resources: [
      {
        id: resourceId(THIS_MACHINE),
        name: THIS_MACHINE,
        kind: 'machine',
        layer: 'personal',
        available: probed !== undefined,
        facts,
      },
      ...view.resources,
    ],
  };
  return { inventory, person, repository, historyRepository, paths, view: withThisMachine };
}
