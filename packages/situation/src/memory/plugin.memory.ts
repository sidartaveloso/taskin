import { type EnvelopeOf, type EventHandler, type EventMap, type EventType, eventId } from '../system/envelope';
import { type PluginKey, type PluginVersion, pluginVersion } from '../system/plugin.types';
import type { IClockPort } from '../use-cases/ports.types';

/** A versao do contrato que as implementacoes em memoria cumprem. */
export const MEMORY_VERSION: PluginVersion = pluginVersion('0.1.0');

/**
 * O que todo plugin em memoria tem em comum: o ciclo de vida, os handlers e o
 * envelope. So ligado o plugin emite; o id do envelope leva a chave do plugin,
 * e por isso nao se repete no sistema.
 */
export abstract class MemoryPlugin<TEvents extends EventMap> {
  abstract readonly key: PluginKey;
  abstract readonly name: string;
  abstract readonly description: string;
  readonly version: PluginVersion = MEMORY_VERSION;

  private live = false;
  private emitted = 0;
  private readonly handlers = new Map<string, Set<EventHandler<never>>>();

  protected constructor(protected readonly clock: IClockPort) {}

  get running(): boolean {
    return this.live;
  }

  async start(): Promise<void> {
    this.live = true;
  }

  async stop(): Promise<void> {
    this.live = false;
  }

  on<TType extends keyof TEvents & EventType>(type: TType, handler: EventHandler<EnvelopeOf<TEvents, TType>>): void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as EventHandler<never>);
    this.handlers.set(type, set);
  }

  off<TType extends keyof TEvents & EventType>(type: TType, handler: EventHandler<EnvelopeOf<TEvents, TType>>): void {
    this.handlers.get(type)?.delete(handler as EventHandler<never>);
  }

  protected emit<TType extends keyof TEvents & EventType>(type: TType, payload: TEvents[TType]): void {
    if (!this.live) return;
    this.emitted += 1;
    const envelope: EnvelopeOf<TEvents, TType> = {
      id: eventId(`${this.key}:${this.emitted}`),
      type,
      occurredAt: this.clock.now(),
      source: { plugin: this.key, version: this.version },
      payload,
    };
    for (const handler of [...(this.handlers.get(type) ?? [])]) {
      (handler as EventHandler<typeof envelope>)(envelope);
    }
  }
}
