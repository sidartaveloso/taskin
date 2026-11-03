import {
  capability,
  createEnvSecretStore,
  createLocalInventory,
  createLocalMachineProbe,
  type FactView,
  instant,
  personId,
  repositoryId,
  resourceId,
  type SituationView,
} from '@opentask/taskin-situation';
import os from 'os';
import path from 'path';

const FACT_TTL_MS = 24 * 60 * 60 * 1000;
const THIS_MACHINE = 'this-machine';

/** A situacao do repositorio em `root` com esta maquina sondada: usada pelo `status` e pelo `list --where`. */
export async function probeSituation(root: string): Promise<SituationView> {
  const repository = path.basename(root);
  const clock = { now: () => instant(Date.now()) };

  const inventory = createLocalInventory(
    { clock, secrets: createEnvSecretStore(), settings: { leaseTtlMs: 60 * 60 * 1000, factTtlMs: FACT_TTL_MS } },
    {
      repository: repositoryId(repository),
      repositoryConfig: path.join(root, '.taskin.json'),
      personalResources: path.join(os.homedir(), '.config', 'taskin', 'resources.json'),
    },
  );
  const view = await inventory.view(personId(os.userInfo().username), repositoryId(repository));

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

  return {
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
}
