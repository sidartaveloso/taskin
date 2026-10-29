import { type Instant, instant, type PersonId, type ResourceId, type SecretRef } from './branded';
import type {
  IClockPort,
  IMachineProbePort,
  IProviderUsagePort,
  ISecretStorePort,
  ProbedFacts,
  SituationPorts,
  SituationSettings,
  UsageReading,
} from './ports.types';

/** As portas de mentira que os cenarios usam. Cada uma deixa o caso controlar o mundo de fora. */

export class FakeClock implements IClockPort {
  private current: Instant;

  constructor(start: number = Date.UTC(2026, 9, 29, 9, 0, 0)) {
    this.current = instant(start);
  }

  now(): Instant {
    return this.current;
  }

  advance(ms: number): void {
    this.current = instant(this.current + ms);
  }
}

export class FakeSecretStore implements ISecretStorePort {
  private readonly values = new Map<string, string>();

  set(person: PersonId, ref: SecretRef, value: string): void {
    this.values.set(`${person}\u0000${ref}`, value);
  }

  async read(person: PersonId, ref: SecretRef): Promise<string | undefined> {
    return this.values.get(`${person}\u0000${ref}`);
  }
}

export class FakeMachineProbe implements IMachineProbePort {
  private readonly facts = new Map<ResourceId, ProbedFacts>();

  set(machine: ResourceId, facts: ProbedFacts): void {
    this.facts.set(machine, facts);
  }

  async probe(machine: ResourceId): Promise<ProbedFacts | undefined> {
    return this.facts.get(machine);
  }
}

export class FakeProviderUsage implements IProviderUsagePort {
  private readonly readings = new Map<ResourceId, UsageReading>();

  set(access: ResourceId, reading: UsageReading): void {
    this.readings.set(access, reading);
  }

  async usage(access: ResourceId): Promise<UsageReading | undefined> {
    return this.readings.get(access);
  }
}

export interface FakePorts extends SituationPorts {
  readonly clock: FakeClock;
  readonly secrets: FakeSecretStore;
  readonly probe: FakeMachineProbe;
  readonly usage: FakeProviderUsage;
}

export const DEFAULT_TEST_SETTINGS: SituationSettings = {
  leaseTtlMs: 60 * 60 * 1000,
  factTtlMs: 24 * 60 * 60 * 1000,
};

export function createFakePorts(settings: SituationSettings = DEFAULT_TEST_SETTINGS): FakePorts {
  return {
    clock: new FakeClock(),
    secrets: new FakeSecretStore(),
    probe: new FakeMachineProbe(),
    usage: new FakeProviderUsage(),
    settings,
  };
}
