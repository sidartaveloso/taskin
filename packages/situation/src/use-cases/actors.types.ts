import type {
  AccessKind,
  Capability,
  DataClass,
  Difficulty,
  Instant,
  PersonId,
  RepositoryId,
  ResourceId,
  SecretRef,
  TaskRef,
} from './branded';
import type {
  LeaseDenied,
  LeaseExpired,
  LeaseGranted,
  LeaseRequest,
  LeaseReturned,
  RunFinished,
  RunOutcome,
  RunPlanned,
  RunStarted,
} from './flows.types';
import type { SituationPorts } from './ports.types';

/* As declaracoes de recurso. Nenhuma leva endereco, hostname ou segredo. */

export interface MachineDeclaration {
  readonly kind: 'machine';
  /** Nome logico, o unico que aparece no que e versionado. */
  readonly name: string;
  readonly capabilities: readonly Capability[];
}

export interface AccessDeclaration {
  readonly kind: 'access';
  readonly name: string;
  readonly accessKind: AccessKind;
  /** Onde o segredo esta. O valor e lido na guarda de cada pessoa, no emprestimo. */
  readonly secret: SecretRef;
  /** A variavel de ambiente que recebe o segredo na execucao. */
  readonly envVar: string;
  /** O dado que o acesso esta liberado a receber. Padrao: `public`. */
  readonly clearance?: DataClass;
  /**
   * Quantas execucoes o provedor aceita ao mesmo tempo nesta conta. Sem ele,
   * nao ha limite rigido: a conta e dividida quando falta conta livre.
   */
  readonly concurrencyLimit?: number;
}

export type ResourceDeclaration = MachineDeclaration | AccessDeclaration;

/* O quadro da situacao. */

export type Layer = 'repository' | 'personal';

export interface FactView {
  readonly capability: Capability;
  readonly origin: 'declared' | 'probed';
  /** So nos fatos sondados. */
  readonly observedAt?: Instant;
  /** Fato sondado mais velho que o prazo dos fatos. */
  readonly expired: boolean;
}

export const UNAVAILABLE_CODES = [
  /** A pessoa nao tem, na guarda dela, o segredo que o acesso pede. */
  'missing-credential',
  /** A sondagem nao teve resposta da maquina. */
  'unreachable',
] as const;

export type UnavailableCode = (typeof UNAVAILABLE_CODES)[number];

export interface ResourceView {
  readonly id: ResourceId;
  readonly name: string;
  readonly kind: ResourceDeclaration['kind'];
  readonly layer: Layer;
  readonly available: boolean;
  readonly reason?: { readonly code: UnavailableCode; readonly detail: string };
  readonly facts: readonly FactView[];
}

export interface SituationView {
  readonly repository: RepositoryId;
  readonly observedAt: Instant;
  readonly resources: readonly ResourceView[];
}

/* Os atores: um contrato por papel, e cada metodo e uma historia. */

/** O time de um repositorio: a camada do repositorio. */
export interface ITeamActor {
  /** Oferece um recurso a quem trabalha no repositorio. */
  offer(declaration: ResourceDeclaration): Promise<ResourceId>;
  /** Tira as maquinas pessoais do repositorio, mesmo as liberadas. */
  restrictPersonalMachines(): Promise<void>;
  /** Diz que dado um acesso do repositorio esta liberado a receber. */
  classify(access: ResourceId, clearance: DataClass): Promise<void>;
}

/** Quem desenvolve: a camada da pessoa. */
export interface IDeveloperActor {
  /** Declara um recurso seu. Ele ainda nao aparece em repositorio nenhum. */
  declare(declaration: ResourceDeclaration): Promise<ResourceId>;
  /** Libera um recurso seu para um repositorio. */
  release(resource: ResourceId, repository: RepositoryId): Promise<void>;
  /** O quadro: as duas camadas somadas, com o que esta disponivel e por que nao. */
  situation(repository: RepositoryId): Promise<SituationView>;
  /** As execucoes fechadas no repositorio, com a dificuldade estimada e a encontrada. */
  runs(repository: RepositoryId): Promise<readonly RunFinished[]>;
}

/** Quem roda a task (o sandcastle, um agente), por uma pessoa, numa maquina. */
export interface IExecutorActor {
  requestLease(request: LeaseRequest): Promise<LeaseGranted | LeaseDenied>;
  returnLease(lease: LeaseGranted): Promise<LeaseReturned | LeaseExpired>;
  planRun(repository: RepositoryId, task: TaskRef, estimated: Difficulty): Promise<RunPlanned>;
  startRun(run: RunPlanned, lease: LeaseGranted): Promise<RunStarted>;
  finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished>;
}

/** O elenco que uma implementacao entrega: cada ator ja amarrado ao seu contexto. */
export interface ISituationActors {
  team(repository: RepositoryId): ITeamActor;
  developer(person: PersonId): IDeveloperActor;
  executor(person: PersonId, machine: ResourceId): IExecutorActor;
}

/** Como uma implementacao nasce: das portas, e de nada mais. */
export type CreateSituation = (ports: SituationPorts) => ISituationActors;
