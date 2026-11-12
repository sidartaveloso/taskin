import type { ActorsOf } from '../system/actors-of.types';
import type { EnvelopeOf, EventHandler } from '../system/envelope';
import type { IPluginSituation } from '../system/plugin.types';
import type { IChannelSenderPort } from '../system/plugins/channels/channels.types';
import { type FlowRule, flowRuleId, type IEventSourcePort } from '../system/plugins/flows/flows.types';
import type { ICalibrationRunnerPort } from '../system/plugins/probe/probe.types';
import type { ISituation, SituationEventMap, SituationEventType, SystemPorts } from '../system/situation.types';
import type { CreateSituation, ISituationActors, SituationView } from '../use-cases/actors.types';
import type { PersonId, RepositoryId } from '../use-cases/branded';
import type { RunPlanned, RunStarted } from '../use-cases/flows.types';
import type { SituationPorts } from '../use-cases/ports.types';
import { createMemoryAccessBroker } from './access-broker.memory';
import { createMemoryChannels } from './channels.memory';
import { createMemoryFlows } from './flows.memory';
import { createMemoryInventory } from './inventory.memory';
import { createMemoryPeople } from './people.memory';
import { createMemoryProbe } from './probe.memory';
import { createMemoryRunLedger } from './run-ledger.memory';
import { createMemoryScheduler } from './scheduler.memory';

type AnyHandler = EventHandler<never>;
type AnyPlugin = Pick<IPluginSituation<never>, 'running' | 'start' | 'stop'> & {
  on(type: string, handler: AnyHandler): void;
  off(type: string, handler: AnyHandler): void;
};

/** As regras que ligam um plugin ao outro, como o `ISituation` as descreve. */
function systemRules(situation: Omit<ISituation, 'flows'>): FlowRule<SituationEventMap>[] {
  return [
    {
      id: flowRuleId('probe-to-inventory'),
      when: 'probe:machine-probed',
      react: (e) => situation.inventory.recordProbe(e.payload.machine, e.payload.facts),
    },
    {
      id: flowRuleId('unreachable-to-inventory'),
      when: 'probe:machine-unreachable',
      react: (e) => situation.inventory.recordProbe(e.payload.machine, undefined),
    },
    {
      id: flowRuleId('viewpoint-requested-to-channels'),
      when: 'people:viewpoint-requested',
      react: async (e) => {
        await situation.channels.notify(e.payload.reviewer, {
          subject: 'Pedido de ponto de vista',
          body: `Um pedido de ponto de vista em ${e.payload.expertise}, na ${e.payload.task}.`,
        });
      },
    },
    {
      id: flowRuleId('viewpoint-delivered-to-run-ledger'),
      when: 'people:viewpoint-delivered',
      react: (e) => situation.runLedger.recordViewpoint({ state: 'delivered', ...e.payload }),
    },
  ];
}

/**
 * O sistema em memoria: os oito plugins em memoria, o `access-broker` lendo o
 * `inventory`, e as regras do sistema no `flows`, ligadas no `start`.
 */
export function createMemorySituation(ports: SystemPorts): ISituation {
  const inventory = createMemoryInventory(ports);
  const probe = createMemoryProbe(ports);
  const runLedger = createMemoryRunLedger(ports);
  const accessBroker = createMemoryAccessBroker({ ...ports, catalog: inventory, runs: runLedger });
  const scheduler = createMemoryScheduler(ports);
  const channels = createMemoryChannels(ports);
  const people = createMemoryPeople(ports);

  const owners: Record<string, AnyPlugin> = {
    inventory,
    probe,
    'access-broker': accessBroker,
    'run-ledger': runLedger,
    scheduler,
    channels,
    people,
  } as unknown as Record<string, AnyPlugin>;

  const ownerOf = (type: string): AnyPlugin => {
    const owner = owners[type.slice(0, type.indexOf(':'))];
    if (owner === undefined) throw new RangeError(`nenhum plugin emite ${type}`);
    return owner;
  };

  const events: IEventSourcePort<SituationEventMap> = {
    subscribe(type, handler) {
      const owner = ownerOf(type);
      owner.on(type, handler as AnyHandler);
      return () => owner.off(type, handler as AnyHandler);
    },
  };
  const flows = createMemoryFlows<SituationEventMap>({ clock: ports.clock, events });
  owners.flows = flows as unknown as AnyPlugin;

  const plugins = [inventory, probe, accessBroker, runLedger, scheduler, channels, people, flows];
  let rulesConnected = false;

  const situation: ISituation = {
    inventory,
    probe,
    accessBroker,
    runLedger,
    scheduler,
    channels,
    people,
    flows,
    get running() {
      return plugins.every((p) => p.running);
    },
    async start() {
      for (const plugin of plugins) await plugin.start();
      if (rulesConnected) return;
      rulesConnected = true;
      for (const rule of systemRules(situation)) await flows.connect(rule);
    },
    async stop() {
      for (const plugin of plugins) await plugin.stop();
    },
    on<TType extends SituationEventType>(type: TType, handler: EventHandler<EnvelopeOf<SituationEventMap, TType>>) {
      ownerOf(type).on(type, handler as AnyHandler);
    },
    off<TType extends SituationEventType>(type: TType, handler: EventHandler<EnvelopeOf<SituationEventMap, TType>>) {
      ownerOf(type).off(type, handler as AnyHandler);
    },
  };
  return situation;
}

/** Fora do sistema inteiro, ninguem calibra e nenhum canal entrega. */
const NO_CALIBRATION: ICalibrationRunnerPort = { run: async () => undefined };
const NO_SENDER: IChannelSenderPort = { send: async () => false };

/**
 * Os atores do nivel 1 como vistas sobre o sistema. O registro de pessoas diz
 * quem e de fora: quem nao esta nele, num repositorio que tem registro, so ve o
 * material dos pedidos que recebe, nada do inventario nem do registro de
 * execucao.
 *
 * As vistas fazem a ligacao que a historia pede mesmo com o sistema parado: o
 * quadro sonda as maquinas e grava a sondagem; a entrega grava o ponto de vista
 * na execucao. Com o sistema ligado, o `flows` faz o mesmo, e as duas gravacoes
 * coincidem.
 */
export function memoryActorsOf(ports: Pick<SituationPorts, 'clock' | 'people'>): ActorsOf {
  return (situation: ISituation): ISituationActors => {
    const outsider = async (person: PersonId, repository: RepositoryId): Promise<boolean> => {
      const members = await ports.people.members(repository);
      return members.length > 0 && !members.some((m) => m.id === person);
    };

    const origin = (person: PersonId, run: RunPlanned | RunStarted) => ({
      repository: run.repository,
      task: run.task,
      run: run.id,
      requestedBy: person,
    });

    return {
      team: (repository) => ({
        offer: (declaration) => situation.inventory.offer(repository, declaration),
        restrictPersonalMachines: () => situation.inventory.restrictPersonalMachines(repository),
        classify: (access, clearance) => situation.inventory.classify(repository, access, clearance),
        invite: (person) => situation.people.invite(repository, person),
      }),
      developer: (person) => ({
        declare: (declaration) => situation.inventory.declare(person, declaration),
        release: (resource, repository) => situation.inventory.release(person, resource, repository),
        async situation(repository): Promise<SituationView> {
          if (await outsider(person, repository)) {
            return { repository, observedAt: ports.clock.now(), resources: [] };
          }
          for (const machine of await situation.inventory.machines(person, repository)) {
            const report = await situation.probe.probe(machine.id);
            await situation.inventory.recordProbe(machine.id, report.state === 'probed' ? report.facts : undefined);
          }
          return situation.inventory.view(person, repository);
        },
        async runs(repository) {
          return (await outsider(person, repository)) ? [] : situation.runLedger.runs(repository);
        },
        consentToViewpoints: (consent) => situation.people.consent(person, consent),
        withdrawViewpointConsent: () => situation.people.withdrawConsent(person),
        async viewpoints(repository, task) {
          return (await outsider(person, repository)) ? [] : situation.runLedger.viewpoints(repository, task);
        },
      }),
      executor: (person) => ({
        requestLease: (request) => situation.accessBroker.requestLease(person, request),
        returnLease: (lease) => situation.accessBroker.returnLease(lease),
        planRun: (repository, task, estimated) => situation.runLedger.planRun(repository, task, estimated),
        startRun: (run, access) => situation.runLedger.startRun(run, access.access),
        finishRun: (run, outcome) => situation.runLedger.finishRun(run, outcome),
        requestViewpoint: (run, ask) => situation.people.requestViewpoint(origin(person, run), ask),
        followViewpoint: (request) => situation.people.follow(request),
      }),
      reviewer: (person) => ({
        requests: () => situation.people.requests(person),
        accept: (request) => situation.people.accept(request),
        decline: (request, reason) => situation.people.decline(request, reason),
        async deliver(accepted, answer) {
          const result = await situation.people.deliver(accepted, answer);
          if (result.state === 'delivered') await situation.runLedger.recordViewpoint(result);
          return result;
        },
        responseTimes: () => situation.people.responseTimes(person),
      }),
    };
  };
}

/** O nivel 1 contra o sistema em memoria: as portas do nivel 1, e `memoryActorsOf` sobre o sistema. */
export const createMemorySituationActors: CreateSituation = (ports) =>
  memoryActorsOf(ports)(createMemorySituation({ ...ports, calibration: NO_CALIBRATION, sender: NO_SENDER }));
