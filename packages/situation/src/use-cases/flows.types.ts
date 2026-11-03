import type {
  AccessKind,
  DataClass,
  Difficulty,
  DurationMs,
  Expertise,
  Instant,
  LeaseId,
  PersonId,
  RepositoryId,
  ResourceId,
  RunId,
  TaskRef,
  TokenCount,
  ViewpointId,
} from './branded';

/*
 * Os fluxos em typestate. Cada estado e um handle no participio, e cada
 * operacao so aceita o handle do estado certo: o caminho errado nao compila.
 *
 *   acesso:     AccessGranted | LeaseGranted | LeaseDenied
 *   reserva:    LeaseGranted  →  LeaseReturned | LeaseExpired
 *   execucao:   RunPlanned  →  RunStarted  →  RunFinished
 *   ponto de vista: ViewpointRequested  →  ViewpointAccepted | ViewpointDeclined
 *                   ViewpointAccepted   →  ViewpointDelivered
 *                   e, em qualquer passo antes da entrega, ViewpointExpired no prazo
 */

/** O pedido de um acesso pelo tipo, feito por quem vai executar uma task. */
export interface LeaseRequest {
  readonly repository: RepositoryId;
  readonly task: TaskRef;
  readonly kind: AccessKind;
  /** A sensibilidade do que a task mostra ao modelo. */
  readonly sensitivity: DataClass;
  /**
   * A conta que o plano ja escolheu para esta task. Com ela, o broker entrega
   * aquela conta ou recusa com o motivo; sem ela, escolhe a menos ocupada.
   */
  readonly access?: ResourceId;
}

/**
 * O acesso entregue a uma execucao sem reserva: a conta nao declara capacidade,
 * entao nenhuma vaga foi ocupada, nada foi gravado e nao ha prazo nem devolucao.
 */
export interface AccessGranted {
  readonly state: 'granted';
  readonly reserved: false;
  readonly access: ResourceId;
  /**
   * O ambiente da execucao, com o segredo no nome de variavel que o acesso
   * declara. Vive so aqui: nunca no inventario, no quadro ou no registro.
   */
  readonly env: Readonly<Record<string, string>>;
}

/** A reserva: o acesso entregue a uma execucao com uma vaga ocupada, com prazo, numa conta que declara capacidade. */
export interface LeaseGranted extends Omit<AccessGranted, 'reserved'> {
  readonly reserved: true;
  readonly id: LeaseId;
  readonly grantedAt: Instant;
  readonly expiresAt: Instant;
  /** Se a conta ja tinha outra reserva em curso: a vaga foi dividida com outra execucao. */
  readonly shared: boolean;
}

/** O que o pedido de um acesso entrega: a conta, com ou sem reserva. So a reserva tem o que devolver. */
export type AccessGrant = AccessGranted | LeaseGranted;

export const LEASE_DENIAL_CODES = [
  /** Nenhum acesso daquele tipo esta a vista desta pessoa neste repositorio. */
  'no-access-of-kind',
  /** Ha acesso do tipo, mas nenhum liberado para a sensibilidade pedida. */
  'no-cleared-access',
  /** Todos os acessos que servem declaram capacidade e estao com todas as vagas reservadas. */
  'all-at-provider-limit',
  /** A conta fixada no pedido nao esta a vista desta pessoa neste repositorio, ou o segredo dela nao esta na guarda. */
  'unknown-access',
] as const;

export type LeaseDenialCode = (typeof LEASE_DENIAL_CODES)[number];

export interface LeaseDenied {
  readonly state: 'denied';
  readonly reason: { readonly code: LeaseDenialCode; readonly detail: string };
}

export interface LeaseReturned {
  readonly state: 'returned';
  readonly id: LeaseId;
}

/** Devolvida depois do prazo: a vaga ja tinha voltado sozinha. */
export interface LeaseExpired {
  readonly state: 'expired';
  readonly id: LeaseId;
}

export interface RunPlanned {
  readonly state: 'planned';
  readonly id: RunId;
  readonly repository: RepositoryId;
  readonly task: TaskRef;
  readonly estimated: Difficulty;
  readonly plannedAt: Instant;
}

export interface RunStarted extends Omit<RunPlanned, 'state'> {
  readonly state: 'started';
  readonly access: ResourceId;
  readonly startedAt: Instant;
}

/** O que aconteceu na execucao, dito por quem executou. */
export interface RunOutcome {
  /**
   * O modelo que a execucao usou: o que o acesso declara, ou o tipo do acesso
   * quando nao declara. E o que o historico do time sabe da conta.
   */
  readonly model: string;
  /** A dificuldade encontrada. Sem ela, a execucao nao fecha. */
  readonly found: Difficulty;
  readonly tokens: TokenCount;
  readonly iterations: number;
  readonly completed: boolean;
  /** Se foi preciso refazer o que um modelo mais fraco entregou. */
  readonly reworked: boolean;
}

export interface RunFinished extends Omit<RunStarted, 'state'>, RunOutcome {
  readonly state: 'finished';
  readonly finishedAt: Instant;
  readonly duration: DurationMs;
}

/**
 * O que o time sabe de uma execucao fechada, e o unico que vai ao repositorio:
 * o suficiente para calibrar a dificuldade e a taxa de conclusao por modelo.
 * Nao leva a conta, que na camada da pessoa tem o nome que a pessoa escolheu,
 * nem horario algum, que diria quando ela trabalha.
 */
export type RunRecord = Pick<
  RunFinished,
  | 'id'
  | 'repository'
  | 'task'
  | 'estimated'
  | 'found'
  | 'model'
  | 'tokens'
  | 'iterations'
  | 'completed'
  | 'reworked'
  | 'duration'
>;

/**
 * Uma execucao que comecou e nao terminou, como esta maquina a conhece: qual
 * conta ela usa e desde quando. Fica so na maquina, nunca no repositorio.
 */
export type OpenRun = Pick<RunStarted, 'id' | 'access' | 'startedAt'>;

/* ─── O pedido de ponto de vista humano ─────────────────────────────────── */

/** Uma peca do material do pedido: um link, uma captura, um esquematico. */
export interface ViewpointMaterial {
  readonly label: string;
  /** Onde o material esta. E tudo o que a pessoa consultada ve do projeto. */
  readonly uri: string;
}

/** O que quem executa pergunta, a uma competencia e nao a uma pessoa. */
export interface ViewpointAsk {
  readonly expertise: Expertise;
  readonly question: string;
  readonly material: readonly ViewpointMaterial[];
  /** Depois disto o pedido vence sozinho. */
  readonly dueAt: Instant;
}

/** O pedido aberto, ja com a pessoa escolhida. Pode estar esperando o horario dela. */
export interface ViewpointRequested extends ViewpointAsk {
  readonly state: 'requested';
  readonly id: ViewpointId;
  readonly repository: RepositoryId;
  readonly task: TaskRef;
  /** A execucao que chegou a etapa de opiniao humana: a resposta fica registrada nela. */
  readonly run: RunId;
  /** Para quem a execucao roda: a autora do trabalho, que nunca o revisa. */
  readonly requestedBy: PersonId;
  readonly reviewer: PersonId;
  readonly requestedAt: Instant;
  /**
   * Quando o pedido chega a pessoa: o comeco do proximo horario em que ela esta
   * presente. Igual a `requestedAt` quando ela ja esta.
   */
  readonly deliverableFrom: Instant;
}

export const VIEWPOINT_DENIAL_CODES = [
  /** Ninguem que consentiu em receber pedidos daquela competencia esta a vista. */
  'no-consenting-expert',
  /** Quem consentiu ja esta na carga que declarou para a semana. */
  'over-capacity',
  /** A unica pessoa que consentiu e quem fez o trabalho. */
  'only-the-author',
] as const;

export type ViewpointDenialCode = (typeof VIEWPOINT_DENIAL_CODES)[number];

export interface ViewpointDenied {
  readonly state: 'denied';
  readonly reason: { readonly code: ViewpointDenialCode; readonly detail: string };
}

export interface ViewpointAccepted extends Omit<ViewpointRequested, 'state'> {
  readonly state: 'accepted';
  readonly acceptedAt: Instant;
}

/** A pessoa pode recusar, sempre, e diz por que. */
export interface ViewpointDeclined extends Omit<ViewpointRequested, 'state'> {
  readonly state: 'declined';
  readonly reason: string;
  readonly declinedAt: Instant;
}

/** O ponto de vista entregue, como fica registrado na execucao da task. */
export interface ViewpointDelivered {
  readonly state: 'delivered';
  readonly id: ViewpointId;
  readonly repository: RepositoryId;
  readonly task: TaskRef;
  readonly run: RunId;
  readonly expertise: Expertise;
  readonly question: string;
  readonly reviewer: PersonId;
  readonly answer: string;
  readonly deliveredAt: Instant;
}

/** O prazo passou antes da entrega. Ninguem e cobrado por isso. */
export interface ViewpointExpired {
  readonly state: 'expired';
  readonly id: ViewpointId;
}

export type ViewpointState =
  | ViewpointRequested
  | ViewpointAccepted
  | ViewpointDeclined
  | ViewpointDelivered
  | ViewpointExpired;
