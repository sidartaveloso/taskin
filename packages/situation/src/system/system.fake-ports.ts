import {
  type AccessKind,
  difficulty,
  type PersonId,
  type RepositoryId,
  type ResourceId,
  runId,
  taskRef,
} from '../use-cases/branded';
import { createFakePorts, DEFAULT_TEST_SETTINGS, type FakePorts } from '../use-cases/fake-ports';
import type { SituationSettings } from '../use-cases/ports.types';
import { type EnvelopeOf, type EventHandler, eventId } from './envelope';
import { pluginKey, pluginVersion } from './plugin.types';
import type { IAccessCatalogPort, IOpenRunsPort, LendableAccess } from './plugins/access-broker/access-broker.types';
import type { ChannelName, IChannelSenderPort, Notice } from './plugins/channels/channels.types';
import type { IEventSourcePort } from './plugins/flows/flows.types';
import type {
  CalibrationSample,
  CalibrationTarget,
  CalibrationTask,
  ICalibrationRunnerPort,
} from './plugins/probe/probe.types';

/** As portas falsas do nivel 2: as do nivel 1 mais as que so os plugins pedem. */

export class FakeCalibrationRunner implements ICalibrationRunnerPort {
  private readonly samples = new Map<string, CalibrationSample>();
  readonly calls: CalibrationTarget[] = [];

  set(target: CalibrationTarget, sample: CalibrationSample): void {
    this.samples.set(`${target.machine}\u0000${target.access}`, sample);
  }

  async run(target: CalibrationTarget, _task: CalibrationTask): Promise<CalibrationSample | undefined> {
    this.calls.push(target);
    return this.samples.get(`${target.machine}\u0000${target.access}`);
  }
}

export class FakeChannelSender implements IChannelSenderPort {
  private readonly down = new Set<ChannelName>();
  readonly sent: { readonly channel: ChannelName; readonly notice: Notice }[] = [];

  fail(channel: ChannelName): void {
    this.down.add(channel);
  }

  async send(channel: ChannelName, notice: Notice): Promise<boolean> {
    if (this.down.has(channel)) return false;
    this.sent.push({ channel, notice });
    return true;
  }
}

export class FakeAccessCatalog implements IAccessCatalogPort {
  private readonly entries: { person: PersonId; repository: RepositoryId; access: LendableAccess }[] = [];

  add(person: PersonId, repository: RepositoryId, access: LendableAccess): void {
    this.entries.push({ person, repository, access });
  }

  async accesses(person: PersonId, repository: RepositoryId, kind: AccessKind): Promise<readonly LendableAccess[]> {
    return this.entries
      .filter((e) => e.person === person && e.repository === repository && e.access.accessKind === kind)
      .map((e) => e.access);
  }
}

/** As execucoes em aberto de mentira: o que o registro de execucoes diria ao access broker. */
export class FakeOpenRuns implements IOpenRunsPort {
  private readonly open: RunStarted[] = [];
  private sequence = 0;

  /** Comeca `count` execucoes (uma, por padrao) na conta, sem terminar nenhuma. */
  begin(access: ResourceId, repository: RepositoryId, startedAt: RunStarted['startedAt'], count = 1): void {
    for (let i = 0; i < count; i += 1) {
      this.sequence += 1;
      this.open.push({
        state: 'started',
        id: runId(`open-${this.sequence}`),
        repository,
        task: taskRef(`task-open-${this.sequence}`),
        estimated: difficulty(2),
        plannedAt: startedAt,
        access,
        startedAt,
      });
    }
  }

  async openRuns(): Promise<readonly RunStarted[]> {
    return [...this.open];
  }
}

/** O mapa de eventos de mentira que a suite do `flows` escuta. */
export type DemoEvents = {
  readonly 'demo:thing-happened': { readonly count: number };
  readonly 'demo:other-thing-happened': { readonly label: string };
};

export class FakeEventSource implements IEventSourcePort<DemoEvents> {
  private readonly handlers = new Map<string, Set<EventHandler<never>>>();
  private sequence = 0;

  subscribe<K extends keyof DemoEvents>(type: K, handler: EventHandler<EnvelopeOf<DemoEvents, K>>): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as EventHandler<never>);
    this.handlers.set(type, set);
    return () => set.delete(handler as EventHandler<never>);
  }

  /** Emite um evento de mentira e devolve o envelope que os handlers receberam. */
  emit<K extends keyof DemoEvents>(type: K, payload: DemoEvents[K], at: number): EnvelopeOf<DemoEvents, K> {
    this.sequence += 1;
    const envelope: EnvelopeOf<DemoEvents, K> = {
      id: eventId(`demo-${this.sequence}`),
      type,
      occurredAt: at as EnvelopeOf<DemoEvents, K>['occurredAt'],
      source: { plugin: pluginKey('demo'), version: pluginVersion('0.0.0') },
      payload,
    };
    for (const handler of this.handlers.get(type) ?? []) (handler as EventHandler<typeof envelope>)(envelope);
    return envelope;
  }
}

export type FakeSystemPorts = FakePorts & {
  readonly calibration: FakeCalibrationRunner;
  readonly sender: FakeChannelSender;
};

/** As portas de um plugin sozinho, sem o sistema: o que viria de outro plugin vem de mentira. */
export type FakePluginPorts = FakeSystemPorts & {
  readonly catalog: FakeAccessCatalog;
  readonly runs: FakeOpenRuns;
  readonly events: FakeEventSource;
};

export function createFakeSystemPorts(settings: SituationSettings = DEFAULT_TEST_SETTINGS): FakeSystemPorts {
  return {
    ...createFakePorts(settings),
    calibration: new FakeCalibrationRunner(),
    sender: new FakeChannelSender(),
  };
}

export function createFakePluginPorts(settings: SituationSettings = DEFAULT_TEST_SETTINGS): FakePluginPorts {
  return {
    ...createFakeSystemPorts(settings),
    catalog: new FakeAccessCatalog(),
    runs: new FakeOpenRuns(),
    events: new FakeEventSource(),
  };
}
