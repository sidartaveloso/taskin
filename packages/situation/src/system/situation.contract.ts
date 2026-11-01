import { describe, expect, it } from 'vitest';
import { capability, difficulty, runId, taskRef, tokenCount } from '../use-cases/branded';
import type { LeaseDenied, LeaseGranted } from '../use-cases/flows.types';
import { ANA, account, BRUNO, DOCKER, leaseRequest, machine, REPO, secretValueOf } from '../use-cases/scenarios';
import { acceptedViewpoint, ask, consent, DESIGN, registerTeam, requested } from '../use-cases/viewpoint-scenarios';
import type { ChannelName } from './plugins/channels/channels.types';
import type { CreateSystem, ISituation, SituationEvent, SituationEventType } from './situation.types';
import { createFakeSystemPorts, type FakeSystemPorts } from './system.fake-ports';

/**
 * As jornadas que atravessam plugins: o que so acontece quando o sistema liga
 * um plugin ao outro, pelas portas e pelo `flows`. As suites de cada plugin
 * dizem o que cada um faz sozinho; estas dizem o que o conjunto faz.
 */

export interface SystemContractCase {
  readonly name: string;
  run(situation: ISituation, ports: FakeSystemPorts): Promise<void>;
}

const TASKINBOARD = 'taskinboard' as ChannelName;

/** Deixa as regras do `flows` terminarem. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function record(situation: ISituation, types: readonly SituationEventType[]): SituationEvent[] {
  const seen: SituationEvent[] = [];
  for (const type of types) situation.on(type, (envelope) => seen.push(envelope as SituationEvent));
  return seen;
}

function granted(result: LeaseGranted | LeaseDenied): LeaseGranted {
  expect(result.state, result.state === 'denied' ? result.reason.detail : '').toBe('granted');
  return result as LeaseGranted;
}

/** Uma maquina e uma conta da Ana, liberadas para o repositorio, com o segredo na guarda dela. */
async function anaWithOneAccount(situation: ISituation, ports: FakeSystemPorts) {
  const notebook = await situation.inventory.declare(ANA, machine('notebook', 'docker'));
  await situation.inventory.release(ANA, notebook, REPO);
  const declaration = account('conta-a');
  const conta = await situation.inventory.declare(ANA, declaration);
  await situation.inventory.release(ANA, conta, REPO);
  ports.secrets.set(ANA, declaration.secret, secretValueOf('conta-a'));
  return { notebook, conta };
}

const ALL_TYPES: readonly SituationEventType[] = [
  'inventory:resource-declared',
  'inventory:resource-released',
  'inventory:facts-recorded',
  'probe:machine-probed',
  'access-broker:lease-granted',
  'access-broker:lease-returned',
  'run-ledger:run-planned',
  'run-ledger:run-started',
  'run-ledger:run-finished',
  'run-ledger:viewpoint-recorded',
  'people:consent-given',
  'people:viewpoint-requested',
  'people:viewpoint-accepted',
  'people:viewpoint-delivered',
  'channels:notice-sent',
  'channels:notice-held',
  'flows:rule-fired',
];

export const SYSTEM_CONTRACT_CASES: readonly SystemContractCase[] = [
  {
    name: 'ligar o sistema liga todos os plugins; desligar desliga todos',
    async run(situation) {
      const plugins = () => [
        situation.inventory,
        situation.probe,
        situation.accessBroker,
        situation.runLedger,
        situation.scheduler,
        situation.channels,
        situation.people,
        situation.flows,
      ];
      expect(situation.running).toBe(false);

      await situation.start();
      expect(situation.running).toBe(true);
      expect(plugins().map((p) => p.running)).toEqual(plugins().map(() => true));

      await situation.stop();
      expect(plugins().map((p) => p.running)).toEqual(plugins().map(() => false));
    },
  },
  {
    name: 'cada envelope traz no tipo a chave de quem o emitiu, e um id unico no sistema',
    async run(situation, ports) {
      await situation.start();
      const seen = record(situation, ALL_TYPES);
      const { notebook } = await anaWithOneAccount(situation, ports);
      ports.probe.set(notebook, { capabilities: [DOCKER], observedAt: ports.clock.now() });
      await situation.probe.probe(notebook);
      await settle();

      expect(seen.length).toBeGreaterThan(0);
      for (const envelope of seen) {
        expect(envelope.type.startsWith(`${envelope.source.plugin}:`)).toBe(true);
      }
      expect(new Set(seen.map((e) => e.id)).size).toBe(seen.length);
    },
  },
  {
    name: 'a sondagem de uma maquina chega ao quadro do inventario, com a data',
    async run(situation, ports) {
      await situation.start();
      const { notebook } = await anaWithOneAccount(situation, ports);
      const seenAt = ports.clock.now();
      ports.probe.set(notebook, { capabilities: [DOCKER, capability('gpu')], observedAt: seenAt });

      await situation.probe.probe(notebook);
      await settle();

      const view = await situation.inventory.view(ANA, REPO);
      const facts = view.resources.find((r) => r.id === notebook)?.facts ?? [];
      expect(facts).toContainEqual({ capability: 'gpu', origin: 'probed', observedAt: seenAt, expired: false });
    },
  },
  {
    name: 'a maquina que nao responde a sondagem fica indisponivel no quadro',
    async run(situation, ports) {
      await situation.start();
      const { notebook } = await anaWithOneAccount(situation, ports);

      await situation.probe.probe(notebook);
      await settle();

      const view = await situation.inventory.view(ANA, REPO);
      expect(view.resources.find((r) => r.id === notebook)?.reason?.code).toBe('unreachable');
    },
  },
  {
    name: 'o emprestimo usa as contas do inventario: so as liberadas, com a classificacao do repositorio',
    async run(situation, ports) {
      const personal = account('conta-pessoal');
      const unreleased = await situation.inventory.declare(ANA, personal);
      ports.secrets.set(ANA, personal.secret, secretValueOf('conta-pessoal'));
      expect((await situation.accessBroker.requestLease(ANA, leaseRequest())).state).toBe('denied');

      const team = account('conta-do-time');
      const shared = await situation.inventory.offer(REPO, team);
      ports.secrets.set(ANA, team.secret, secretValueOf('conta-do-time'));
      await situation.inventory.release(ANA, unreleased, REPO);
      await situation.inventory.classify(REPO, shared, 'sensitive');

      const lease = granted(await situation.accessBroker.requestLease(ANA, leaseRequest('sensitive')));
      expect(lease.access).toBe(shared);
      expect(lease.env).toEqual({ CLAUDE_CODE_OAUTH_TOKEN: secretValueOf('conta-do-time') });
    },
  },
  {
    name: 'uma execucao inteira: planejada, emprestimo, iniciada, finalizada e devolvida, em ordem',
    async run(situation, ports) {
      await situation.start();
      const seen = record(situation, ALL_TYPES);
      const { conta } = await anaWithOneAccount(situation, ports);

      const planned = await situation.runLedger.planRun(REPO, taskRef('task-7'), difficulty(2));
      const lease = granted(await situation.accessBroker.requestLease(ANA, leaseRequest('public', 'task-7')));
      const started = await situation.runLedger.startRun(planned, lease.access);
      const finished = await situation.runLedger.finishRun(started, {
        found: difficulty(3),
        tokens: tokenCount(5_000),
        iterations: 2,
        completed: true,
        reworked: false,
      });
      await situation.accessBroker.returnLease(lease);

      expect(seen.map((e) => e.type).filter((t) => !t.startsWith('inventory:'))).toEqual([
        'run-ledger:run-planned',
        'access-broker:lease-granted',
        'run-ledger:run-started',
        'run-ledger:run-finished',
        'access-broker:lease-returned',
      ]);
      expect(await situation.runLedger.runs(REPO)).toEqual([finished]);
      expect(await situation.runLedger.consumption(conta, planned.plannedAt)).toBe(5_000);
    },
  },
  {
    name: 'nenhum envelope do sistema leva o valor de um segredo',
    async run(situation, ports) {
      await situation.start();
      const seen = record(situation, ALL_TYPES);
      await anaWithOneAccount(situation, ports);

      const lease = granted(await situation.accessBroker.requestLease(ANA, leaseRequest()));
      await situation.accessBroker.returnLease(lease);

      expect(JSON.stringify(seen)).not.toContain(secretValueOf('conta-a'));
    },
  },
  {
    name: 'o pedido de ponto de vista avisa quem vai revisar, pelo canal que a pessoa prefere',
    async run(situation, ports) {
      await situation.start();
      registerTeam(ports);
      await situation.people.consent(ANA, consent([DESIGN]));
      await situation.channels.prefer(ANA, [TASKINBOARD]);
      const origin = { repository: REPO, task: taskRef('task-9'), run: runId('run-9'), requestedBy: BRUNO };

      requested(await situation.people.requestViewpoint(origin, ask(ports, DESIGN)));
      await settle();

      expect(ports.sender.sent.map((s) => [s.channel, s.notice.person])).toEqual([[TASKINBOARD, ANA]]);
    },
  },
  {
    name: 'ausente, quem vai revisar recebe o aviso quando volta',
    async run(situation, ports) {
      await situation.start();
      registerTeam(ports);
      await situation.people.consent(ANA, consent([DESIGN]));
      await situation.channels.prefer(ANA, [TASKINBOARD]);
      ports.presence.set(ANA, false);
      const origin = { repository: REPO, task: taskRef('task-9'), run: runId('run-9'), requestedBy: BRUNO };

      requested(await situation.people.requestViewpoint(origin, ask(ports, DESIGN)));
      await settle();
      expect(ports.sender.sent).toEqual([]);

      ports.presence.set(ANA, true);
      await situation.channels.flush();
      expect(ports.sender.sent.map((s) => s.notice.person)).toEqual([ANA]);
    },
  },
  {
    name: 'o ponto de vista entregue fica registrado na execucao da task, pelo flows',
    async run(situation, ports) {
      await situation.start();
      registerTeam(ports);
      await situation.people.consent(ANA, consent([DESIGN]));
      const planned = await situation.runLedger.planRun(REPO, taskRef('task-12'), difficulty(2));
      const origin = { repository: REPO, task: planned.task, run: planned.id, requestedBy: BRUNO };
      const request = requested(await situation.people.requestViewpoint(origin, ask(ports, DESIGN)));

      const accepted = acceptedViewpoint(await situation.people.accept(request));
      const delivered = await situation.people.deliver(accepted, 'Aumentar o respiro.');
      await settle();

      expect(await situation.runLedger.viewpoints(REPO, planned.task)).toEqual([delivered]);
    },
  },
  {
    name: 'parado, o sistema nao emite nem liga um plugin ao outro',
    async run(situation, ports) {
      const seen = record(situation, ALL_TYPES);
      const { notebook } = await anaWithOneAccount(situation, ports);
      ports.probe.set(notebook, { capabilities: [capability('gpu')], observedAt: ports.clock.now() });

      await situation.probe.probe(notebook);
      await settle();

      expect(seen).toEqual([]);
      const view = await situation.inventory.view(ANA, REPO);
      expect(view.resources.find((r) => r.id === notebook)?.facts.some((f) => f.origin === 'probed')).toBe(false);
    },
  },
  {
    name: 'as regras do sistema aparecem no flows',
    async run(situation) {
      await situation.start();
      expect((await situation.flows.rules()).length).toBeGreaterThanOrEqual(4);
    },
  },
];

/** Registra as jornadas contra uma implementacao do sistema inteiro. */
export function describeSystemContract(label: string, create: CreateSystem): void {
  describe(`jornadas do sistema: ${label}`, () => {
    for (const contractCase of SYSTEM_CONTRACT_CASES) {
      it(contractCase.name, async () => {
        const ports = createFakeSystemPorts();
        await contractCase.run(create(ports), ports);
      });
    }
  });
}
