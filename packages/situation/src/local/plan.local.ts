import { existsSync, readFileSync } from 'node:fs';
import type { PlanAccessInput, PlanMachineInput } from '../plan/build-problem';
import { readSchedulingSettings, type SchedulingSettings } from '../plan/scheduling-settings';
import type { IInventory } from '../system/plugins/inventory/inventory.types';
import type { IRunLedger } from '../system/plugins/run-ledger/run-ledger.types';
import type { ResourceDeclaration, SituationView } from '../use-cases/actors.types';
import { type AccessKind, accessKind, type PersonId, type RepositoryId } from '../use-cases/branded';
import type { RunFinished } from '../use-cases/flows.types';
import type { LocalInventoryPaths } from './inventory.local';

export interface LocalPlanSources {
  readonly inventory: IInventory;
  readonly ledger: IRunLedger;
  readonly person: PersonId;
  readonly repository: RepositoryId;
  /** O quadro, ja com o que a sondagem desta maquina viu. */
  readonly view: SituationView;
  readonly paths: LocalInventoryPaths;
}

export interface LocalPlanResources {
  readonly accesses: readonly PlanAccessInput[];
  readonly machines: readonly PlanMachineInput[];
  readonly runs: readonly RunFinished[];
  readonly settings: SchedulingSettings;
}

function declarationsIn(path: string): ResourceDeclaration[] {
  if (!existsSync(path)) return [];
  const json = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const offers = (json.resources as { offers?: ResourceDeclaration[] } | undefined)?.offers ?? [];
  const personal = Object.entries(json)
    .filter(([key, value]) => key !== 'resources' && Array.isArray(value))
    .flatMap(([, entries]) => (entries as { declaration?: ResourceDeclaration }[]).map((e) => e.declaration))
    .filter((d): d is ResourceDeclaration => d !== undefined);
  return [...offers, ...personal];
}

/** Os tipos de acesso que as duas camadas declaram. */
function accessKinds(paths: LocalInventoryPaths): AccessKind[] {
  const kinds = [paths.repositoryConfig, paths.personalResources]
    .flatMap(declarationsIn)
    .flatMap((d) => (d.kind === 'access' ? [String(d.accessKind)] : []));
  return [...new Set(kinds)].sort().map(accessKind);
}

/**
 * O que o `taskin plan` le do disco: os acessos disponiveis com a liberacao,
 * as maquinas disponiveis com os fatos validos, as execucoes do registro e
 * `resources.scheduling`.
 */
export async function localPlanResources(sources: LocalPlanSources): Promise<LocalPlanResources> {
  const { inventory, person, repository, view } = sources;
  const available = new Set(view.resources.filter((r) => r.available).map((r) => r.id));

  const accesses: PlanAccessInput[] = [];
  for (const kind of accessKinds(sources.paths)) {
    for (const a of await inventory.accesses(person, repository, kind)) {
      if (available.has(a.id)) {
        accesses.push({ id: a.id, name: a.name, accessKind: a.accessKind, clearance: a.clearance });
      }
    }
  }

  const machines: PlanMachineInput[] = view.resources
    .filter((r) => r.kind === 'machine' && r.available)
    .map((m) => ({
      id: m.id,
      name: m.name,
      capabilities: m.facts.filter((f) => !f.expired).map((f) => String(f.capability)),
    }));

  return {
    accesses,
    machines,
    runs: await sources.ledger.runs(repository),
    settings: readSchedulingSettings(sources.paths.repositoryConfig),
  };
}
