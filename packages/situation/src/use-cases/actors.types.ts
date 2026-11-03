import type {
  AccessKind,
  Capability,
  DataClass,
  Difficulty,
  DurationMs,
  Expertise,
  Instant,
  PersonId,
  RepositoryId,
  ResourceId,
  SecretRef,
  TaskRef,
  ViewpointId,
} from './branded';
import type {
  AccessGrant,
  LeaseDenied,
  LeaseExpired,
  LeaseGranted,
  LeaseRequest,
  LeaseReturned,
  RunFinished,
  RunOutcome,
  RunPlanned,
  RunStarted,
  ViewpointAccepted,
  ViewpointAsk,
  ViewpointDeclined,
  ViewpointDelivered,
  ViewpointDenied,
  ViewpointExpired,
  ViewpointRequested,
  ViewpointState,
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
  /** Onde o segredo esta. O valor e lido na guarda de cada pessoa, ao entregar o acesso. */
  readonly secret: SecretRef;
  /** A variavel de ambiente que recebe o segredo na execucao. */
  readonly envVar: string;
  /** O dado que o acesso esta liberado a receber. Padrao: `public`. */
  readonly clearance?: DataClass;
  /**
   * A capacidade da conta: quantas execucoes o provedor aceita ao mesmo tempo.
   * So com ela a conta e reservada (uma vaga por execucao, com prazo). Sem ela
   * nao ha reserva: a conta aceita quantas execucoes vierem.
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

/* Pessoas como recurso do papel quem: o consentimento e o tempo de resposta. */

/** 0 e domingo, como em `Date.prototype.getUTCDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** O horario em que a pessoa aceita receber pedidos, na hora local dela. */
export interface WorkingHours {
  readonly weekdays: readonly Weekday[];
  /** Minutos desde a meia-noite local, o comeco incluido e o fim nao. */
  readonly fromMinute: number;
  readonly toMinute: number;
  /** A diferenca da hora local para UTC, em minutos: `-180` em Brasilia. */
  readonly utcOffsetMinutes: number;
}

/**
 * O que a pessoa aceita receber. Sem consentimento, ninguem e consultado. A
 * competencia e o que ela aceita divulgar; carga e horario ficam na camada dela.
 */
export interface ViewpointConsent {
  readonly expertise: readonly Expertise[];
  /** Quantos pedidos por semana, nos ultimos sete dias, ela aceita receber. */
  readonly weeklyLoad: number;
  readonly hours: WorkingHours;
}

/** Quanto a pessoa levou para responder um pedido. Visto so por ela, nunca como placar. */
export interface ResponseTime {
  readonly viewpoint: ViewpointId;
  readonly outcome: 'delivered' | 'declined';
  /** Do momento em que o pedido chegou a ela ate a resposta. */
  readonly respondedIn: DurationMs;
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
  /**
   * Convida gente de fora do registro de pessoas, um especialista, a receber
   * pedidos deste repositorio. O convidado so ve o material dos pedidos.
   */
  invite(person: PersonId): Promise<void>;
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
  /** Aceita receber pedidos de ponto de vista, nos termos que ela mesma da. Declarar de novo substitui. */
  consentToViewpoints(consent: ViewpointConsent): Promise<void>;
  /** Para de receber pedidos novos. */
  withdrawViewpointConsent(): Promise<void>;
  /** Os pontos de vista entregues numa task, registrados nas execucoes dela. */
  viewpoints(repository: RepositoryId, task: TaskRef): Promise<readonly ViewpointDelivered[]>;
}

/** Quem da um ponto de vista: so ve os proprios pedidos e o proprio tempo de resposta. */
export interface IReviewerActor {
  /** Os pedidos para esta pessoa que ja chegaram a ela (no horario e presente) e nao fecharam. */
  requests(): Promise<readonly (ViewpointRequested | ViewpointAccepted)[]>;
  accept(request: ViewpointRequested): Promise<ViewpointAccepted | ViewpointExpired>;
  decline(request: ViewpointRequested, reason: string): Promise<ViewpointDeclined | ViewpointExpired>;
  deliver(accepted: ViewpointAccepted, answer: string): Promise<ViewpointDelivered | ViewpointExpired>;
  /** O proprio tempo de resposta, e de mais ninguem. */
  responseTimes(): Promise<readonly ResponseTime[]>;
}

/** Quem roda a task (o sandcastle, um agente), por uma pessoa, numa maquina. */
export interface IExecutorActor {
  requestLease(request: LeaseRequest): Promise<AccessGrant | LeaseDenied>;
  returnLease(lease: LeaseGranted): Promise<LeaseReturned | LeaseExpired>;
  planRun(repository: RepositoryId, task: TaskRef, estimated: Difficulty): Promise<RunPlanned>;
  startRun(run: RunPlanned, access: AccessGrant): Promise<RunStarted>;
  finishRun(run: RunStarted, outcome: RunOutcome): Promise<RunFinished>;
  /**
   * Pede um ponto de vista humano pela competencia, numa execucao que ainda nao
   * fechou: volta aberto, ja com a pessoa escolhida, ou negado com o motivo.
   */
  requestViewpoint(run: RunPlanned | RunStarted, ask: ViewpointAsk): Promise<ViewpointRequested | ViewpointDenied>;
  /** Em que estado esta um pedido feito por esta execucao. */
  followViewpoint(request: ViewpointRequested): Promise<ViewpointState>;
}

/** O elenco que uma implementacao entrega: cada ator ja amarrado ao seu contexto. */
export interface ISituationActors {
  team(repository: RepositoryId): ITeamActor;
  developer(person: PersonId): IDeveloperActor;
  executor(person: PersonId, machine: ResourceId): IExecutorActor;
  reviewer(person: PersonId): IReviewerActor;
}

/** Como uma implementacao nasce: das portas, e de nada mais. */
export type CreateSituation = (ports: SituationPorts) => ISituationActors;
