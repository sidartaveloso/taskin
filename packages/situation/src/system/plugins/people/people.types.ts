import type { ResponseTime, ViewpointConsent } from '../../../use-cases/actors.types';
import type { Expertise, PersonId, RepositoryId, RunId, TaskRef } from '../../../use-cases/branded';
import type {
  ViewpointAccepted,
  ViewpointAsk,
  ViewpointDeclined,
  ViewpointDelivered,
  ViewpointDenied,
  ViewpointExpired,
  ViewpointRequested,
  ViewpointState,
} from '../../../use-cases/flows.types';
import type { SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * Pessoas como recurso do papel quem: a competencia que cada uma divulga, o
 * consentimento, a disponibilidade e os pedidos de ponto de vista. O taskin
 * pede, e a pessoa pode recusar.
 */
export interface IPeople extends IPluginSituation<PeopleEvents> {
  readonly key: PluginKey<'people'>;
  /** Declarar de novo substitui. Sem consentimento ninguem e consultado. */
  consent(person: PersonId, consent: ViewpointConsent): Promise<void>;
  withdrawConsent(person: PersonId): Promise<void>;
  /** Gente de fora do registro de pessoas entra so por convite. */
  invite(repository: RepositoryId, person: PersonId): Promise<void>;
  /**
   * Quem consentiu em receber pedidos desta competencia neste repositorio. So o
   * id: horario e carga ficam na camada da pessoa.
   */
  experts(repository: RepositoryId, expertise: Expertise): Promise<readonly PersonId[]>;
  requestViewpoint(origin: ViewpointOrigin, ask: ViewpointAsk): Promise<ViewpointRequested | ViewpointDenied>;
  follow(request: ViewpointRequested): Promise<ViewpointState>;
  /** Os pedidos desta pessoa que ja chegaram a ela e nao fecharam. */
  requests(reviewer: PersonId): Promise<readonly (ViewpointRequested | ViewpointAccepted)[]>;
  accept(request: ViewpointRequested): Promise<ViewpointAccepted | ViewpointExpired>;
  decline(request: ViewpointRequested, reason: string): Promise<ViewpointDeclined | ViewpointExpired>;
  deliver(accepted: ViewpointAccepted, answer: string): Promise<ViewpointDelivered | ViewpointExpired>;
  /** O tempo de resposta da propria pessoa, e de mais ninguem. */
  responseTimes(person: PersonId): Promise<readonly ResponseTime[]>;
}

/** De onde vem o pedido: a execucao que chegou a etapa de opiniao humana. */
export interface ViewpointOrigin {
  readonly repository: RepositoryId;
  readonly task: TaskRef;
  readonly run: RunId;
  /** Para quem a execucao roda: a autora, que nunca revisa o proprio trabalho. */
  readonly requestedBy: PersonId;
}

export type PeoplePorts = Pick<SituationPorts, 'clock' | 'people' | 'presence'>;

/**
 * Os eventos nunca levam horario, carga ou tempo de resposta: disponibilidade
 * e dado pessoal, e nada de placar de gente. O motivo de uma recusa tambem fica
 * so com quem pediu, no `ViewpointDeclined`.
 */
export type PeopleEvents = {
  readonly 'people:consent-given': { readonly person: PersonId; readonly expertise: readonly Expertise[] };
  readonly 'people:consent-withdrawn': { readonly person: PersonId };
  readonly 'people:person-invited': { readonly repository: RepositoryId; readonly person: PersonId };
  readonly 'people:viewpoint-requested': Pick<
    ViewpointRequested,
    'id' | 'repository' | 'task' | 'run' | 'expertise' | 'reviewer' | 'dueAt' | 'deliverableFrom'
  >;
  readonly 'people:viewpoint-denied': ViewpointOrigin & {
    readonly expertise: Expertise;
    readonly reason: ViewpointDenied['reason'];
  };
  readonly 'people:viewpoint-accepted': Pick<ViewpointAccepted, 'id' | 'reviewer' | 'acceptedAt'>;
  readonly 'people:viewpoint-declined': Pick<ViewpointDeclined, 'id' | 'reviewer' | 'declinedAt'>;
  readonly 'people:viewpoint-delivered': Omit<ViewpointDelivered, 'state'>;
  readonly 'people:viewpoint-expired': Pick<ViewpointExpired, 'id'>;
};
