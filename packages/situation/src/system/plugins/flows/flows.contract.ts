import { expect } from 'vitest';
import type { EnvelopeOf } from '../../envelope';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { DemoEvents } from '../../system.fake-ports';
import { DuplicateFlowRuleError, type FlowRule, type FlowsEvents, flowRuleId, type IFlows } from './flows.types';

type Seen = EnvelopeOf<DemoEvents, 'demo:thing-happened'>;

function counting(id: string, seen: Seen[]): FlowRule<DemoEvents> {
  return {
    id: flowRuleId(id),
    when: 'demo:thing-happened',
    async react(envelope) {
      seen.push(envelope);
    },
  };
}

const failing = (id: string): FlowRule<DemoEvents> => ({
  id: flowRuleId(id),
  when: 'demo:thing-happened',
  async react() {
    throw new Error('o outro plugin caiu');
  },
});

/** Deixa as regras assincronas terminarem. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

export const FLOWS_CONTRACT_CASES: readonly PluginContractCase<IFlows<DemoEvents>>[] = [
  ...lifecycleCases<FlowsEvents, IFlows<DemoEvents>>(async (flows, ports) => {
    const id = `regra-${(await flows.rules()).length}`;
    await flows.connect(counting(id, []));
    ports.events.emit('demo:thing-happened', { count: 1 }, ports.clock.now());
    await settle();
    await flows.disconnect(flowRuleId(id));
    return 'flows:rule-fired';
  }, 'flows:rule-fired'),
  {
    name: 'ligado, a regra recebe o envelope do evento que escuta, e so dele',
    async run(flows, ports) {
      await flows.start();
      const seen: Seen[] = [];
      await flows.connect(counting('conta', seen));

      const envelope = ports.events.emit('demo:thing-happened', { count: 3 }, ports.clock.now());
      ports.events.emit('demo:other-thing-happened', { label: 'outro' }, ports.clock.now());
      await settle();

      expect(seen).toEqual([envelope]);
    },
  },
  {
    name: 'parado, nenhuma regra dispara',
    async run(flows, ports) {
      const seen: Seen[] = [];
      await flows.connect(counting('conta', seen));
      await flows.start();
      await flows.stop();

      ports.events.emit('demo:thing-happened', { count: 1 }, ports.clock.now());
      await settle();

      expect(seen).toEqual([]);
    },
  },
  {
    name: 'a regra que falha vira evento e nao impede as outras',
    async run(flows, ports) {
      await flows.start();
      const failures = recordEvents(flows, ['flows:rule-failed']);
      const seen: Seen[] = [];
      await flows.connect(failing('quebrada'));
      await flows.connect(counting('conta', seen));

      const envelope = ports.events.emit('demo:thing-happened', { count: 1 }, ports.clock.now());
      await settle();

      expect(seen).toHaveLength(1);
      expect(failures.map((e) => e.payload)).toEqual([
        { rule: 'quebrada', event: envelope.id, type: 'demo:thing-happened', error: 'o outro plugin caiu' },
      ]);
    },
  },
  {
    name: 'desligar a regra para de dispara-la',
    async run(flows, ports) {
      await flows.start();
      const seen: Seen[] = [];
      await flows.connect(counting('conta', seen));
      await flows.disconnect(flowRuleId('conta'));

      ports.events.emit('demo:thing-happened', { count: 1 }, ports.clock.now());
      await settle();

      expect(seen).toEqual([]);
      expect(await flows.rules()).toEqual([]);
    },
  },
  {
    name: 'um id de regra repetido e recusado',
    async run(flows) {
      await flows.connect(counting('conta', []));
      await expect(flows.connect(counting('conta', []))).rejects.toBeInstanceOf(DuplicateFlowRuleError);
      expect(await flows.rules()).toEqual(['conta']);
    },
  },
];

export function describeFlowsContract(label: string, create: CreatePlugin<IFlows<DemoEvents>>): void {
  describeCases(label, create, FLOWS_CONTRACT_CASES);
}
