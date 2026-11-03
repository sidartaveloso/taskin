import { NotImplementedError } from '../use-cases/empty-situation';
import type { EventMap } from './envelope';
import { type PluginKey, pluginKey, pluginVersion } from './plugin.types';
import type { IAccessBroker } from './plugins/access-broker/access-broker.types';
import type { IChannels } from './plugins/channels/channels.types';
import type { IFlows } from './plugins/flows/flows.types';
import type { IInventory } from './plugins/inventory/inventory.types';
import type { IPeople } from './plugins/people/people.types';
import type { IProbe } from './plugins/probe/probe.types';
import type { IRunLedger } from './plugins/run-ledger/run-ledger.types';
import type { IScheduler } from './plugins/scheduler/scheduler.types';
import type { CreateSystem, ISituation, SituationEventMap } from './situation.types';

/**
 * A implementacao vazia do nivel 2: cada plugin sabe so quem e (chave, nome,
 * descricao, versao); todo o resto falha com `NotImplementedError`. As suites
 * rodam contra ela para provar que cada caso falha pelo motivo certo.
 */

const notImplemented =
  (operation: string) =>
  (..._args: readonly unknown[]): never => {
    throw new NotImplementedError(operation);
  };

const rejectNotImplemented =
  (operation: string) =>
  async (..._args: readonly unknown[]): Promise<never> => {
    throw new NotImplementedError(operation);
  };

const EMPTY_VERSION = pluginVersion('0.0.0');

function emptyBase<K extends string>(key: PluginKey<K>, name: string, description: string) {
  return {
    key,
    name,
    description,
    version: EMPTY_VERSION,
    get running(): boolean {
      throw new NotImplementedError(`${key}.running`);
    },
    start: rejectNotImplemented(`${key}.start`),
    stop: rejectNotImplemented(`${key}.stop`),
    on: notImplemented(`${key}.on`),
    off: notImplemented(`${key}.off`),
  };
}

export const createEmptyInventory = (): IInventory => {
  const key = pluginKey('inventory');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(
    emptyBase(key, 'Inventory', 'The two layers of resources, their releases, restrictions and facts'),
    {
      declare: op('declare'),
      release: op('release'),
      offer: op('offer'),
      restrictPersonalMachines: op('restrictPersonalMachines'),
      classify: op('classify'),
      recordProbe: op('recordProbe'),
      view: op('view'),
      machines: op('machines'),
      accesses: op('accesses'),
    },
  );
};

export const createEmptyProbe = (): IProbe => {
  const key = pluginKey('probe');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(
    emptyBase(key, 'Probe', 'What each machine really has, and how each machine and access performs'),
    {
      probe: op('probe'),
      calibrate: op('calibrate'),
    },
  );
};

export const createEmptyAccessBroker = (): IAccessBroker => {
  const key = pluginKey('access-broker');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(
    emptyBase(key, 'Access broker', 'Lends LLM accounts to runs, with the secret only in the run environment'),
    {
      requestLease: op('requestLease'),
      returnLease: op('returnLease'),
      leases: op('leases'),
    },
  );
};

export const createEmptyRunLedger = (): IRunLedger => {
  const key = pluginKey('run-ledger');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(
    emptyBase(key, 'Run ledger', 'Estimated and found difficulty, consumption, and the viewpoints of each run'),
    {
      planRun: op('planRun'),
      startRun: op('startRun'),
      finishRun: op('finishRun'),
      openRuns: op('openRuns'),
      runs: op('runs'),
      consumption: op('consumption'),
      recordViewpoint: op('recordViewpoint'),
      viewpoints: op('viewpoints'),
    },
  );
};

export const createEmptyScheduler = (): IScheduler => {
  const key = pluginKey('scheduler');
  return Object.assign(emptyBase(key, 'Scheduler', 'The objective function, its constraints and the suggested plan'), {
    scorePlan: notImplemented(`${key}.scorePlan`),
    violations: notImplemented(`${key}.violations`),
    suggest: rejectNotImplemented(`${key}.suggest`),
  });
};

export const createEmptyChannels = (): IChannels => {
  const key = pluginKey('channels');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(emptyBase(key, 'Channels', 'Notices through the channel each person prefers, when present'), {
    prefer: op('prefer'),
    notify: op('notify'),
    flush: op('flush'),
    pending: op('pending'),
  });
};

export const createEmptyPeople = (): IPeople => {
  const key = pluginKey('people');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(emptyBase(key, 'People', 'Expertise, consent, availability and viewpoint requests'), {
    consent: op('consent'),
    withdrawConsent: op('withdrawConsent'),
    invite: op('invite'),
    experts: op('experts'),
    requestViewpoint: op('requestViewpoint'),
    follow: op('follow'),
    requests: op('requests'),
    accept: op('accept'),
    decline: op('decline'),
    deliver: op('deliver'),
    responseTimes: op('responseTimes'),
  });
};

export const createEmptyFlows = <TEvents extends EventMap>(): IFlows<TEvents> => {
  const key = pluginKey('flows');
  const op = (name: string) => rejectNotImplemented(`${key}.${name}`);
  return Object.assign(emptyBase(key, 'Flows', 'One plugin event triggering another plugin'), {
    connect: op('connect'),
    disconnect: op('disconnect'),
    rules: op('rules'),
  });
};

export const createEmptySystem: CreateSystem = (): ISituation => ({
  inventory: createEmptyInventory(),
  probe: createEmptyProbe(),
  accessBroker: createEmptyAccessBroker(),
  runLedger: createEmptyRunLedger(),
  scheduler: createEmptyScheduler(),
  channels: createEmptyChannels(),
  people: createEmptyPeople(),
  flows: createEmptyFlows<SituationEventMap>(),
  get running(): boolean {
    throw new NotImplementedError('situation.running');
  },
  start: rejectNotImplemented('situation.start'),
  stop: rejectNotImplemented('situation.stop'),
  on: notImplemented('situation.on'),
  off: notImplemented('situation.off'),
});
