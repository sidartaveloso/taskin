import { existsSync, readFileSync } from 'node:fs';
import { type PlanAccessInput, type PlanMachineInput, windowMsOf } from '../plan/build-problem';
import {
  type AccessSettings,
  readPersonalAccessSettings,
  readSchedulingSettings,
  type SchedulingSettings,
} from '../plan/scheduling-settings';
import type { IInventory } from '../system/plugins/inventory/inventory.types';
import type { IRunLedger } from '../system/plugins/run-ledger/run-ledger.types';
import type { ResourceDeclaration, SituationView } from '../use-cases/actors.types';
import { type AccessKind, accessKind, instant, type PersonId, type RepositoryId } from '../use-cases/branded';
import type { RunRecord } from '../use-cases/flows.types';
import type { IClockPort } from '../use-cases/ports.types';
import type { LocalInventoryPaths } from './inventory.local';

export interface LocalPlanSources {
  readonly inventory: IInventory;
  readonly ledger: IRunLedger;
  readonly clock: IClockPort;
  readonly person: PersonId;
  readonly repository: RepositoryId;
  /** O quadro, ja com o que a sondagem desta maquina viu. */
  readonly view: SituationView;
  readonly paths: LocalInventoryPaths;
}

export interface LocalPlanResources {
  readonly accesses: readonly PlanAccessInput[];
  readonly machines: readonly PlanMachineInput[];
  /** O historico do time. */
  readonly runs: readonly RunRecord[];
  /** O que cada acesso gastou na janela dele, pelo id, no estado desta maquina. */
  readonly spent: Readonly<Record<string, number>>;
  readonly settings: SchedulingSettings;
  /** Avisos para quem roda o plano (a saida local), nunca para um arquivo. */
  readonly warnings: readonly string[];
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
 * as maquinas disponiveis com os fatos validos, o historico do time (o
 * `.taskin/runs.jsonl`), o consumo de cada acesso na janela dele (o estado
 * desta maquina) e `resources.scheduling`.
 */
export async function localPlanResources(sources: LocalPlanSources): Promise<LocalPlanResources> {
  const { inventory, person, repository, view } = sources;
  const available = new Set(view.resources.filter((r) => r.available).map((r) => r.id));

  const settings = readSchedulingSettings(sources.paths.repositoryConfig);
  const personalSettings = readPersonalAccessSettings(sources.paths.personalResources, person);
  const warnings: string[] = [];

  const accesses: PlanAccessInput[] = [];
  for (const kind of accessKinds(sources.paths)) {
    for (const a of await inventory.accesses(person, repository, kind)) {
      // Uma conta da camada da pessoa so tem os ajustes do arquivo da pessoa:
      // o nome dela nao deve estar no `.taskin.json`, que e versionado.
      const personal = a.layer === 'personal';
      if (personal && settings.accesses[a.name] !== undefined) {
        warnings.push(
          `resources.scheduling.accesses in .taskin.json names the personal-layer account "${a.name}" and is ignored for it: move its settings to a "scheduling" key next to the account in your personal resources.json, so the name stays out of the repository.`,
        );
      }
      if (!available.has(a.id)) continue;
      const own: AccessSettings | undefined = personal ? personalSettings[a.name] : undefined;
      accesses.push({
        id: a.id,
        name: a.name,
        accessKind: a.accessKind,
        clearance: a.clearance,
        ...(a.concurrencyLimit === undefined ? {} : { concurrencyLimit: a.concurrencyLimit }),
        ...(personal ? { settings: own ?? {} } : {}),
      });
    }
  }

  const machines: PlanMachineInput[] = view.resources
    .filter((r) => r.kind === 'machine' && r.available)
    .map((m) => ({
      id: m.id,
      name: m.name,
      capabilities: m.facts.filter((f) => !f.expired).map((f) => String(f.capability)),
    }));

  const now = sources.clock.now();
  const spent: Record<string, number> = {};
  for (const a of accesses) {
    spent[a.id] = await sources.ledger.consumption(a.id, instant(now - windowMsOf(a, settings)));
  }

  return { accesses, machines, runs: await sources.ledger.runs(repository), spent, settings, warnings };
}
