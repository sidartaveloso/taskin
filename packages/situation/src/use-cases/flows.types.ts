import type {
  AccessKind,
  DataClass,
  Difficulty,
  DurationMs,
  Instant,
  LeaseId,
  RepositoryId,
  ResourceId,
  RunId,
  TaskRef,
  TokenCount,
} from './branded';

/*
 * Os fluxos em typestate. Cada estado e um handle no participio, e cada
 * operacao so aceita o handle do estado certo: o caminho errado nao compila.
 *
 *   emprestimo: LeaseGranted | LeaseDenied  →  LeaseReturned | LeaseExpired
 *   execucao:   RunPlanned  →  RunStarted  →  RunFinished
 */

/** O pedido de um acesso pelo tipo, feito por quem vai executar uma task. */
export interface LeaseRequest {
  readonly repository: RepositoryId;
  readonly task: TaskRef;
  readonly kind: AccessKind;
  /** A sensibilidade do que a task mostra ao modelo. */
  readonly sensitivity: DataClass;
}

/** O acesso entregue a uma execucao, com prazo. */
export interface LeaseGranted {
  readonly state: 'granted';
  readonly id: LeaseId;
  readonly access: ResourceId;
  /**
   * O ambiente da execucao, com o segredo no nome de variavel que o acesso
   * declara. Vive so aqui: nunca no inventario, no quadro ou no registro.
   */
  readonly env: Readonly<Record<string, string>>;
  readonly grantedAt: Instant;
  readonly expiresAt: Instant;
  /** Se a conta foi dividida com outra execucao, por nao haver conta livre. */
  readonly shared: boolean;
}

export const LEASE_DENIAL_CODES = [
  /** Nenhum acesso daquele tipo esta a vista desta pessoa neste repositorio. */
  'no-access-of-kind',
  /** Ha acesso do tipo, mas nenhum liberado para a sensibilidade pedida. */
  'no-cleared-access',
  /** Todos os acessos que servem estao no limite que o provedor declara. */
  'all-at-provider-limit',
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

/** Devolvido depois do prazo: a conta ja tinha voltado sozinha. */
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
