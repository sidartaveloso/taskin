import { z } from 'zod';
import { type Brand, type Instant, instant } from '../use-cases/branded';
import type { PluginKey, PluginVersion } from './plugin.types';

/*
 * Os eventos em envelope, nunca achatados: o envelope diz quem, quando e o que;
 * o payload leva so o fato. O mapa nome → payload de cada plugin e a fonte
 * unica dos tipos; o envelope e validado por Zod na fronteira.
 */

export type EventId = Brand<string, 'EventId'>;

export function eventId(value: string): EventId {
  if (value.trim() === '') throw new RangeError('EventId vazio');
  return value as EventId;
}

/** O tipo de um evento: `'<chave do plugin>:<fato no passado>'`, como `access-broker:lease-granted`. */
export type EventType = `${string}:${string}`;

/** O mapa de um plugin: cada tipo de evento e o payload que ele leva. */
export type EventMap = { readonly [type: EventType]: unknown };

export interface EnvelopeSource {
  readonly plugin: PluginKey;
  readonly version: PluginVersion;
}

export interface Envelope<TType extends EventType, TPayload> {
  readonly id: EventId;
  readonly type: TType;
  readonly occurredAt: Instant;
  readonly source: EnvelopeSource;
  readonly payload: TPayload;
}

/** A uniao dos envelopes de um mapa: um membro por tipo de evento. */
export type EnvelopesOf<TMap extends EventMap> = {
  readonly [K in keyof TMap & EventType]: Envelope<K, TMap[K]>;
}[keyof TMap & EventType];

/** O envelope de um tipo so, dentro de um mapa. */
export type EnvelopeOf<TMap extends EventMap, TType extends keyof TMap & EventType> = Envelope<TType, TMap[TType]>;

export type EventHandler<TEnvelope> = (envelope: TEnvelope) => void;

/** O esquema do payload de cada tipo do mapa: o que a fronteira confere. */
export type EventCatalog<TMap extends EventMap> = {
  readonly [K in keyof TMap & EventType]: z.ZodType<TMap[K]>;
};

export interface EnvelopeIssue {
  /** Onde no envelope, em pontos: `payload.count`, `source.plugin`. Vazio quando e o envelope todo. */
  readonly path: string;
  readonly message: string;
}

export type ParsedEnvelope<TMap extends EventMap> =
  | { readonly ok: true; readonly envelope: EnvelopesOf<TMap> }
  | { readonly ok: false; readonly issues: readonly EnvelopeIssue[] };

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const envelopeShape = z.object({
  id: z.string().min(1),
  type: z.string().regex(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/, 'o tipo e <plugin>:<fato-no-passado>, em kebab'),
  occurredAt: z.number().int().nonnegative(),
  source: z.object({
    plugin: z.string().regex(KEBAB, 'a chave do plugin e kebab'),
    version: z.string().min(1),
  }),
  payload: z.unknown(),
});

function issuesOf(error: z.ZodError, prefix: readonly PropertyKey[] = []): EnvelopeIssue[] {
  return error.issues.map((issue) => ({
    path: [...prefix, ...issue.path].map(String).join('.'),
    message: issue.message,
  }));
}

/**
 * Confere um envelope vindo de fora (do daemon, de um arquivo, de outra maquina)
 * contra o catalogo de um plugin ou do sistema. Nunca lanca: devolve o envelope
 * tipado ou a lista do que esta errado.
 */
export function parseEnvelope<TMap extends EventMap>(
  catalog: EventCatalog<TMap>,
  input: unknown,
): ParsedEnvelope<TMap> {
  const shape = envelopeShape.safeParse(input);
  if (!shape.success) return { ok: false, issues: issuesOf(shape.error) };

  const { id, type, occurredAt, source, payload } = shape.data;
  if (!type.startsWith(`${source.plugin}:`)) {
    return {
      ok: false,
      issues: [{ path: 'type', message: `o tipo ${type} nao comeca pela chave do plugin ${source.plugin}` }],
    };
  }

  const schemas: Partial<Record<string, z.ZodType>> = catalog;
  const schema = schemas[type];
  if (schema === undefined) {
    return { ok: false, issues: [{ path: 'type', message: `tipo de evento desconhecido: ${type}` }] };
  }

  const parsedPayload = schema.safeParse(payload);
  if (!parsedPayload.success) return { ok: false, issues: issuesOf(parsedPayload.error, ['payload']) };

  const envelope = {
    id: eventId(id),
    type,
    occurredAt: instant(occurredAt),
    source: { plugin: source.plugin as PluginKey, version: source.version as PluginVersion },
    payload: parsedPayload.data,
  };
  return { ok: true, envelope: envelope as EnvelopesOf<TMap> };
}
