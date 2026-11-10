import type { Capability, Instant, PersonId, RepositoryId, ResourceId, SecretRef, TokenCount } from './branded';

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

/** Uma pessoa como o registro de pessoas a guarda: so o id e o nome, nada de contato. */
export interface PersonRecord {
  readonly id: PersonId;
  readonly name: string;
}

export interface IPeopleRegistryPort {
  /** Quem e do projeto, pelo registro de pessoas do repositorio. Quem nao esta aqui e de fora. */
  members(repository: RepositoryId): Promise<readonly PersonRecord[]>;
}

/**
 * A presenca e o horario de uma pessoa, a camada dela, fora do repositorio. O
 * horario declarado no consentimento diz quando ela aceita pedidos; esta porta
 * diz se ela esta de fato presente agora (no taskinboard, no relogio, no canal).
 */
export interface IPresencePort {
  /** Se a pessoa esta presente, ou `undefined` quando nenhum canal sabe: vale o horario declarado. */
  present(person: PersonId): Promise<boolean | undefined>;
}

export interface SituationSettings {
  /** Quanto tempo dura uma reserva antes de a vaga voltar sozinha. */
  readonly leaseTtlMs: number;
  /** Quanto tempo um fato sondado vale antes de ser marcado como expirado. */
  readonly factTtlMs: number;
}

export interface SituationPorts {
  readonly clock: IClockPort;
  readonly secrets: ISecretStorePort;
  readonly probe: IMachineProbePort;
  readonly usage: IProviderUsagePort;
  readonly people: IPeopleRegistryPort;
  readonly presence: IPresencePort;
  readonly settings: SituationSettings;
}
