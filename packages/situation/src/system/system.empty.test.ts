import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NotImplementedError } from '../use-cases/empty-situation';
import {
  createEmptyAccessBroker,
  createEmptyChannels,
  createEmptyFlows,
  createEmptyInventory,
  createEmptyPeople,
  createEmptyProbe,
  createEmptyRunLedger,
  createEmptyScheduler,
  createEmptySystem,
} from './empty';
import type { PluginContractCase } from './plugin.contract';
import { ACCESS_BROKER_CONTRACT_CASES } from './plugins/access-broker/access-broker.contract';
import { CHANNELS_CONTRACT_CASES } from './plugins/channels/channels.contract';
import { FLOWS_CONTRACT_CASES } from './plugins/flows/flows.contract';
import { INVENTORY_CONTRACT_CASES } from './plugins/inventory/inventory.contract';
import { PEOPLE_CONTRACT_CASES } from './plugins/people/people.contract';
import { PROBE_CONTRACT_CASES } from './plugins/probe/probe.contract';
import { RUN_LEDGER_CONTRACT_CASES } from './plugins/run-ledger/run-ledger.contract';
import { SCHEDULER_CONTRACT_CASES } from './plugins/scheduler/scheduler.contract';
import { SYSTEM_CONTRACT_CASES } from './situation.contract';
import { createFakePluginPorts, createFakeSystemPorts, type DemoEvents } from './system.fake-ports';

/**
 * O vermelho do nivel 2, caso a caso, pelo motivo certo: contra a
 * implementacao vazia, cada caso de cada suite falha com `NotImplementedError`.
 */

function expectRedCaseByCase<P>(label: string, cases: readonly PluginContractCase<P>[], create: () => P): void {
  describe(`${label} contra a implementacao vazia`, () => {
    it('tem casos, sem nome repetido', () => {
      const names = cases.map((c) => c.name);
      expect(names.length).toBeGreaterThan(0);
      expect(new Set(names).size).toBe(names.length);
    });

    for (const contractCase of cases) {
      it(`falha por falta de implementacao: ${contractCase.name}`, async () => {
        await expect(contractCase.run(create(), createFakePluginPorts())).rejects.toBeInstanceOf(NotImplementedError);
      });
    }
  });
}

expectRedCaseByCase('inventory', INVENTORY_CONTRACT_CASES, createEmptyInventory);
expectRedCaseByCase('probe', PROBE_CONTRACT_CASES, createEmptyProbe);
expectRedCaseByCase('access-broker', ACCESS_BROKER_CONTRACT_CASES, createEmptyAccessBroker);
expectRedCaseByCase('run-ledger', RUN_LEDGER_CONTRACT_CASES, createEmptyRunLedger);
expectRedCaseByCase('scheduler', SCHEDULER_CONTRACT_CASES, createEmptyScheduler);
expectRedCaseByCase('channels', CHANNELS_CONTRACT_CASES, createEmptyChannels);
expectRedCaseByCase('people', PEOPLE_CONTRACT_CASES, createEmptyPeople);
expectRedCaseByCase('flows', FLOWS_CONTRACT_CASES, createEmptyFlows<DemoEvents>);

describe('as jornadas do sistema contra a implementacao vazia', () => {
  it('tem casos, sem nome repetido', () => {
    const names = SYSTEM_CONTRACT_CASES.map((c) => c.name);
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names).size).toBe(names.length);
  });

  for (const contractCase of SYSTEM_CONTRACT_CASES) {
    it(`falha por falta de implementacao: ${contractCase.name}`, async () => {
      const ports = createFakeSystemPorts();
      await expect(contractCase.run(createEmptySystem(ports), ports)).rejects.toBeInstanceOf(NotImplementedError);
    });
  }
});

describe('os plugins nao se importam entre si', () => {
  const pluginsDir = join(__dirname, 'plugins');
  const plugins = readdirSync(pluginsDir);

  it('ha uma pasta por plugin', () => {
    expect([...plugins].sort()).toEqual(
      ['access-broker', 'channels', 'flows', 'inventory', 'people', 'probe', 'run-ledger', 'scheduler'].sort(),
    );
  });

  for (const plugin of plugins) {
    it(`${plugin} so importa o nivel 1 e o contrato base`, () => {
      for (const file of readdirSync(join(pluginsDir, plugin))) {
        const source = readFileSync(join(pluginsDir, plugin, file), 'utf8');
        const imports = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1] ?? '');
        const crossing = imports.filter((path) =>
          plugins.some((other) => other !== plugin && path.includes(`/${other}/`)),
        );
        expect(crossing, `${plugin}/${file}`).toEqual([]);
      }
    });
  }
});
