import type { Capability, Instant, PersonId, ResourceId, SecretRef, TokenCount } from './branded';

/** O que vem de fora do sistema. Toda implementacao recebe as portas; nenhuma as cria. */

export interface IClockPort {
  now(): Instant;
}

export interface ISecretStorePort {
  /** O valor do segredo na guarda desta pessoa, ou `undefined` se ela nao o tem. */
  read(person: PersonId, ref: SecretRef): Promise<string | undefined>;
}

export interface ProbedFacts {
  readonly capabilities: readonly Capability[];
  readonly observedAt: Instant;
}

export interface IMachineProbePort {
  /** O que a sondagem viu na maquina, ou `undefined` se ela nao respondeu. */
  probe(machine: ResourceId): Promise<ProbedFacts | undefined>;
}

export interface UsageReading {
  readonly used: TokenCount;
  readonly limit: TokenCount;
  readonly windowEndsAt: Instant;
  readonly observedAt: Instant;
}

export interface IProviderUsagePort {
  /** O consumo de um acesso na janela atual, quando o provedor o informa. */
  usage(access: ResourceId): Promise<UsageReading | undefined>;
}

export interface SituationSettings {
  /** Quanto tempo dura um emprestimo antes de a conta voltar sozinha. */
  readonly leaseTtlMs: number;
  /** Quanto tempo um fato sondado vale antes de ser marcado como expirado. */
  readonly factTtlMs: number;
}

export interface SituationPorts {
  readonly clock: IClockPort;
  readonly secrets: ISecretStorePort;
  readonly probe: IMachineProbePort;
  readonly usage: IProviderUsagePort;
  readonly settings: SituationSettings;
}
