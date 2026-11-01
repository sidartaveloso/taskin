import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { type EventCatalog, parseEnvelope } from './envelope';

type DemoEvents = {
  readonly 'demo:thing-counted': { readonly count: number };
};

const catalog: EventCatalog<DemoEvents> = {
  'demo:thing-counted': z.object({ count: z.number().int() }),
};

const valid = {
  id: 'evt-1',
  type: 'demo:thing-counted',
  occurredAt: Date.UTC(2026, 9, 31),
  source: { plugin: 'demo', version: '0.1.0' },
  payload: { count: 3 },
};

describe('parseEnvelope', () => {
  it('devolve o envelope tipado quando tudo confere', () => {
    const result = parseEnvelope(catalog, valid);

    expect(result).toEqual({ ok: true, envelope: valid });
    if (result.ok) expect(result.envelope.payload.count).toBe(3);
  });

  it('recusa o tipo que nao comeca pela chave do plugin', () => {
    const result = parseEnvelope(catalog, { ...valid, source: { plugin: 'other', version: '0.1.0' } });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((i) => i.path)).toEqual(['type']);
  });

  it('recusa o envelope sem id', () => {
    const { id: _, ...withoutId } = valid;

    const result = parseEnvelope(catalog, withoutId);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((i) => i.path)).toContain('id');
  });

  it('recusa o payload que nao confere com o esquema do tipo', () => {
    const result = parseEnvelope(catalog, { ...valid, payload: { count: 'tres' } });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.map((i) => i.path)).toEqual(['payload.count']);
  });

  it('recusa um tipo que o catalogo nao conhece', () => {
    const result = parseEnvelope(catalog, { ...valid, type: 'demo:thing-vanished' });

    expect(result.ok).toBe(false);
  });

  it('nao lanca com qualquer coisa', () => {
    for (const input of [undefined, null, 42, 'evento', [], {}]) {
      expect(parseEnvelope(catalog, input).ok).toBe(false);
    }
  });
});
