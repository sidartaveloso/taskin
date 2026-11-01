import type { EventMap, EventType } from '../system/envelope';
import { pluginKey } from '../system/plugin.types';
import {
  DuplicateFlowRuleError,
  type FlowRule,
  type FlowRuleId,
  type FlowsEvents,
  type FlowsPorts,
  type IFlows,
} from '../system/plugins/flows/flows.types';
import { MemoryPlugin } from './plugin.memory';

type Reaction = (envelope: { readonly id: FlowsEvents['flows:rule-fired']['event']; readonly type: EventType }) => void;

class MemoryFlows<TEvents extends EventMap> extends MemoryPlugin<FlowsEvents> implements IFlows<TEvents> {
  readonly key = pluginKey('flows');
  readonly name = 'Flows';
  readonly description = 'One plugin event triggering another plugin';

  private readonly connected = new Map<FlowRuleId, () => void>();

  constructor(private readonly ports: FlowsPorts<TEvents>) {
    super(ports.clock);
  }

  async connect(rule: FlowRule<TEvents>): Promise<void> {
    if (this.connected.has(rule.id)) throw new DuplicateFlowRuleError(rule.id);
    const react = rule.react as (envelope: unknown) => Promise<void>;
    const handler: Reaction = (envelope) => {
      if (!this.running) return;
      const fact = { rule: rule.id, event: envelope.id, type: envelope.type };
      Promise.resolve()
        .then(() => react(envelope))
        .then(
          () => this.emit('flows:rule-fired', fact),
          (error: unknown) =>
            this.emit('flows:rule-failed', { ...fact, error: error instanceof Error ? error.message : String(error) }),
        );
    };
    const unsubscribe = this.ports.events.subscribe(rule.when, handler);
    this.connected.set(rule.id, unsubscribe);
  }

  async disconnect(rule: FlowRuleId): Promise<void> {
    this.connected.get(rule)?.();
    this.connected.delete(rule);
  }

  async rules(): Promise<readonly FlowRuleId[]> {
    return [...this.connected.keys()];
  }
}

/** O flows em memoria: cada regra escuta a fonte de eventos, e so dispara ligado. */
export function createMemoryFlows<TEvents extends EventMap>(ports: FlowsPorts<TEvents>): IFlows<TEvents> {
  return new MemoryFlows<TEvents>(ports);
}
