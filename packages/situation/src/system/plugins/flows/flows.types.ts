import type { Brand } from '../../../use-cases/branded';
import type { SituationPorts } from '../../../use-cases/ports.types';
import type { EnvelopeOf, EventHandler, EventId, EventMap, EventType } from '../../envelope';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * O evento de um plugin acionando outro. Os plugins nao se importam entre si:
 * o que liga um ao outro e uma regra aqui, que escuta um tipo de evento e faz
 * alguma coisa com o envelope.
 */
export interface IFlows<TEvents extends EventMap = EventMap> extends IPluginSituation<FlowsEvents> {
  readonly key: PluginKey<'flows'>;
  /** Liga uma regra. Um id repetido e recusado com `DuplicateFlowRuleError`. */
  connect(rule: FlowRule<TEvents>): Promise<void>;
  disconnect(rule: FlowRuleId): Promise<void>;
  rules(): Promise<readonly FlowRuleId[]>;
}

export type FlowRuleId = Brand<string, 'FlowRuleId'>;

export function flowRuleId(value: string): FlowRuleId {
  if (value.trim() === '') throw new RangeError('FlowRuleId vazio');
  return value as FlowRuleId;
}

/** Uma regra: quando um tipo de evento acontece, faz isto com o envelope dele. */
export type FlowRule<TEvents extends EventMap> = {
  readonly [K in keyof TEvents & EventType]: {
    readonly id: FlowRuleId;
    readonly when: K;
    react(envelope: EnvelopeOf<TEvents, K>): Promise<void>;
  };
}[keyof TEvents & EventType];

export class DuplicateFlowRuleError extends Error {
  constructor(readonly rule: FlowRuleId) {
    super(`regra de fluxo repetida: ${rule}`);
    this.name = 'DuplicateFlowRuleError';
  }
}

/** De onde vem os eventos que as regras escutam. No sistema, sao os outros plugins. */
export interface IEventSourcePort<TEvents extends EventMap> {
  subscribe<K extends keyof TEvents & EventType>(type: K, handler: EventHandler<EnvelopeOf<TEvents, K>>): () => void;
}

export type FlowsPorts<TEvents extends EventMap> = Pick<SituationPorts, 'clock'> & {
  readonly events: IEventSourcePort<TEvents>;
};

export type FlowsEvents = {
  readonly 'flows:rule-fired': { readonly rule: FlowRuleId; readonly event: EventId; readonly type: EventType };
  readonly 'flows:rule-failed': {
    readonly rule: FlowRuleId;
    readonly event: EventId;
    readonly type: EventType;
    readonly error: string;
  };
};
