import type { Brand } from '../use-cases/branded';
import type { EnvelopeOf, EventHandler, EventMap, EventType } from './envelope';

/**
 * A chave de um plugin, em kebab: `inventory`, `access-broker`, `run-ledger`.
 * E o prefixo de todos os eventos dele.
 */
export type PluginKey<K extends string = string> = Brand<K, 'PluginKey'>;

/** A versao do contrato que o plugin cumpre, em semver: `0.1.0`. */
export type PluginVersion = Brand<string, 'PluginVersion'>;

export function pluginKey<const K extends string>(value: K): PluginKey<K> {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value)) {
    throw new RangeError(`PluginKey e kebab: ${JSON.stringify(value)}`);
  }
  return value as PluginKey<K>;
}

export function pluginVersion(value: string): PluginVersion {
  if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(value)) {
    throw new RangeError(`PluginVersion e semver: ${JSON.stringify(value)}`);
  }
  return value as PluginVersion;
}

/**
 * O contrato base de todo plugin da consciencia situacional.
 *
 * As operacoes funcionam com o plugin parado ou ligado. O ciclo de vida governa
 * o que acontece sozinho: so ligado o plugin emite eventos, vence prazos e
 * reage ao que vem de fora.
 */
export interface IPluginSituation<TEvents extends EventMap> {
  readonly key: PluginKey;
  readonly name: string;
  readonly description: string;
  readonly version: PluginVersion;
  readonly running: boolean;
  /** Liga o plugin. Ligar o que ja esta ligado nao faz nada. */
  start(): Promise<void>;
  /** Desliga o plugin. Depois disto nenhum handler recebe evento dele. */
  stop(): Promise<void>;
  on<TType extends keyof TEvents & EventType>(type: TType, handler: EventHandler<EnvelopeOf<TEvents, TType>>): void;
  off<TType extends keyof TEvents & EventType>(type: TType, handler: EventHandler<EnvelopeOf<TEvents, TType>>): void;
}

/** O que o `ISituation` guarda de cada plugin: as operacoes e o ciclo de vida, sem os eventos e sem a apresentacao. */
export type PluginOperations<P> = Omit<P, 'on' | 'off' | 'name' | 'description'>;
