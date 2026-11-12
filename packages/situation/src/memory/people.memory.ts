import { pluginKey } from '../system/plugin.types';
import type { IPeople, PeopleEvents, PeoplePorts, ViewpointOrigin } from '../system/plugins/people/people.types';
import type { ResponseTime, ViewpointConsent, WorkingHours } from '../use-cases/actors.types';
import {
  durationMs,
  type Expertise,
  type Instant,
  instant,
  type PersonId,
  type RepositoryId,
  type ViewpointId,
  viewpointId,
} from '../use-cases/branded';
import type {
  ViewpointAccepted,
  ViewpointAsk,
  ViewpointDeclined,
  ViewpointDelivered,
  ViewpointDenied,
  ViewpointExpired,
  ViewpointRequested,
  ViewpointState,
} from '../use-cases/flows.types';
import { MemoryPlugin } from './plugin.memory';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const WEEK = 7 * DAY;

/**
 * O primeiro instante, a partir de `now`, dentro do horario declarado: o
 * proprio `now` quando ja esta nele. Procura ate oito dias adiante; um horario
 * sem dia nenhum nunca chega, e o pedido fica para o fim da busca.
 */
export function nextWorkingInstant(hours: WorkingHours, now: Instant): Instant {
  const offset = hours.utcOffsetMinutes * MINUTE;
  const local = now + offset;
  const today = Math.floor(local / DAY) * DAY;
  for (let day = 0; day <= 8; day += 1) {
    const midnight = today + day * DAY;
    const weekday = new Date(midnight).getUTCDay();
    if (!hours.weekdays.includes(weekday as WorkingHours['weekdays'][number])) continue;
    const from = midnight + hours.fromMinute * MINUTE;
    const to = midnight + hours.toMinute * MINUTE;
    if (local < to) return instant(Math.max(local, from) - offset);
  }
  return instant(today + 9 * DAY - offset);
}

/** Um pedido e o estado em que ele esta. */
export interface StoredViewpoint {
  readonly requested: ViewpointRequested;
  state: ViewpointState;
}

type Stored = StoredViewpoint;

/** As pessoas em memoria; a versao local estende esta e guarda o estado em arquivo. */
export class MemoryPeople extends MemoryPlugin<PeopleEvents> implements IPeople {
  readonly key = pluginKey('people');
  readonly name = 'People';
  readonly description = 'Expertise, consent, availability and viewpoint requests';

  protected sequence = 0;
  protected readonly consents = new Map<PersonId, ViewpointConsent>();
  protected readonly invited = new Map<RepositoryId, PersonId[]>();
  protected readonly viewpoints = new Map<ViewpointId, Stored>();
  protected readonly responses = new Map<PersonId, ResponseTime[]>();

  constructor(private readonly ports: PeoplePorts) {
    super(ports.clock);
  }

  async consent(person: PersonId, consent: ViewpointConsent): Promise<void> {
    this.consents.set(person, consent);
    this.emit('people:consent-given', { person, expertise: consent.expertise });
  }

  async withdrawConsent(person: PersonId): Promise<void> {
    this.consents.delete(person);
    this.emit('people:consent-withdrawn', { person });
  }

  async invite(repository: RepositoryId, person: PersonId): Promise<void> {
    const list = this.invited.get(repository) ?? [];
    if (!list.includes(person)) this.invited.set(repository, [...list, person]);
    this.emit('people:person-invited', { repository, person });
  }

  async experts(repository: RepositoryId, expertise: Expertise): Promise<readonly PersonId[]> {
    return this.consenting(repository, expertise);
  }

  /** O mesmo que `experts`, sem passar pelo metodo publico que a versao local envolve. */
  private async consenting(repository: RepositoryId, expertise: Expertise): Promise<readonly PersonId[]> {
    const members = (await this.ports.people.members(repository)).map((m) => m.id);
    const reachable = [...new Set([...members, ...(this.invited.get(repository) ?? [])])];
    return reachable.filter((person) => this.consents.get(person)?.expertise.includes(expertise) ?? false);
  }

  /** Os pedidos que esta pessoa recebeu nos ultimos sete dias. */
  private load(person: PersonId): number {
    const since = this.clock.now() - WEEK;
    return [...this.viewpoints.values()].filter(
      (v) => v.requested.reviewer === person && v.requested.requestedAt > since,
    ).length;
  }

  /** Vence o que passou do prazo sem entrega. */
  private sweep(): void {
    const now = this.clock.now();
    for (const stored of this.viewpoints.values()) {
      const open = stored.state.state === 'requested' || stored.state.state === 'accepted';
      if (!open || now <= stored.requested.dueAt) continue;
      stored.state = { state: 'expired', id: stored.requested.id };
      this.emit('people:viewpoint-expired', { id: stored.requested.id });
    }
  }

  private deny(origin: ViewpointOrigin, expertise: Expertise, reason: ViewpointDenied['reason']): ViewpointDenied {
    this.emit('people:viewpoint-denied', { ...origin, expertise, reason });
    return { state: 'denied', reason };
  }

  async requestViewpoint(origin: ViewpointOrigin, ask: ViewpointAsk): Promise<ViewpointRequested | ViewpointDenied> {
    this.sweep();
    const experts = await this.consenting(origin.repository, ask.expertise);
    if (experts.length === 0) {
      return this.deny(origin, ask.expertise, {
        code: 'no-consenting-expert',
        detail: `ninguem consentiu em receber pedidos de ${ask.expertise} em ${origin.repository}`,
      });
    }
    const others = experts.filter((p) => p !== origin.requestedBy);
    if (others.length === 0) {
      return this.deny(origin, ask.expertise, {
        code: 'only-the-author',
        detail: `so ${origin.requestedBy}, quem fez o trabalho, consentiu em ${ask.expertise}`,
      });
    }
    const free = others.filter((p) => this.load(p) < (this.consents.get(p)?.weeklyLoad ?? 0));
    const reviewer = [...free].sort((a, b) => this.load(a) - this.load(b))[0];
    if (reviewer === undefined) {
      return this.deny(origin, ask.expertise, {
        code: 'over-capacity',
        detail: `quem consentiu em ${ask.expertise} ja esta na carga da semana`,
      });
    }

    this.sequence += 1;
    const requestedAt = this.clock.now();
    const hours = this.consents.get(reviewer)?.hours;
    const request: ViewpointRequested = {
      ...ask,
      state: 'requested',
      id: viewpointId(`viewpoint-${this.sequence}`),
      repository: origin.repository,
      task: origin.task,
      run: origin.run,
      requestedBy: origin.requestedBy,
      reviewer,
      requestedAt,
      deliverableFrom: hours === undefined ? requestedAt : nextWorkingInstant(hours, requestedAt),
    };
    this.viewpoints.set(request.id, { requested: request, state: request });
    this.emit('people:viewpoint-requested', {
      id: request.id,
      repository: request.repository,
      task: request.task,
      run: request.run,
      expertise: request.expertise,
      reviewer,
      dueAt: request.dueAt,
      deliverableFrom: request.deliverableFrom,
    });
    return request;
  }

  private find(id: ViewpointId): Stored {
    this.sweep();
    const stored = this.viewpoints.get(id);
    if (stored === undefined) throw new RangeError(`pedido de ponto de vista desconhecido: ${id}`);
    return stored;
  }

  async follow(request: ViewpointRequested): Promise<ViewpointState> {
    return this.find(request.id).state;
  }

  async requests(reviewer: PersonId): Promise<readonly (ViewpointRequested | ViewpointAccepted)[]> {
    this.sweep();
    const now = this.clock.now();
    if ((await this.ports.presence.present(reviewer)) === false) return [];
    const open: (ViewpointRequested | ViewpointAccepted)[] = [];
    for (const { requested, state } of this.viewpoints.values()) {
      if (requested.reviewer !== reviewer || requested.deliverableFrom > now) continue;
      if (state.state === 'requested' || state.state === 'accepted') open.push(state);
    }
    return open;
  }

  private expiredOr<T>(stored: Stored, expected: ViewpointState['state'], next: () => T): T | ViewpointExpired {
    if (stored.state.state === 'expired') return stored.state;
    if (stored.state.state !== expected) {
      throw new RangeError(`o pedido ${stored.requested.id} esta ${stored.state.state}, nao ${expected}`);
    }
    return next();
  }

  private respond(stored: Stored, outcome: ResponseTime['outcome'], at: Instant): void {
    const { reviewer, deliverableFrom, id } = stored.requested;
    const list = this.responses.get(reviewer) ?? [];
    list.push({ viewpoint: id, outcome, respondedIn: durationMs(Math.max(0, at - deliverableFrom)) });
    this.responses.set(reviewer, list);
  }

  async accept(request: ViewpointRequested): Promise<ViewpointAccepted | ViewpointExpired> {
    const stored = this.find(request.id);
    return this.expiredOr(stored, 'requested', () => {
      const { state: _, ...rest } = stored.requested;
      const accepted: ViewpointAccepted = { ...rest, state: 'accepted', acceptedAt: this.clock.now() };
      stored.state = accepted;
      this.emit('people:viewpoint-accepted', {
        id: accepted.id,
        reviewer: accepted.reviewer,
        acceptedAt: accepted.acceptedAt,
      });
      return accepted;
    });
  }

  async decline(request: ViewpointRequested, reason: string): Promise<ViewpointDeclined | ViewpointExpired> {
    const stored = this.find(request.id);
    return this.expiredOr(stored, 'requested', () => {
      const { state: _, ...rest } = stored.requested;
      const declined: ViewpointDeclined = { ...rest, state: 'declined', reason, declinedAt: this.clock.now() };
      stored.state = declined;
      this.respond(stored, 'declined', declined.declinedAt);
      this.emit('people:viewpoint-declined', {
        id: declined.id,
        reviewer: declined.reviewer,
        declinedAt: declined.declinedAt,
      });
      return declined;
    });
  }

  async deliver(accepted: ViewpointAccepted, answer: string): Promise<ViewpointDelivered | ViewpointExpired> {
    const stored = this.find(accepted.id);
    return this.expiredOr(stored, 'accepted', () => {
      const { id, repository, task, run, expertise, question, reviewer } = stored.requested;
      const delivered: ViewpointDelivered = {
        state: 'delivered',
        id,
        repository,
        task,
        run,
        expertise,
        question,
        reviewer,
        answer,
        deliveredAt: this.clock.now(),
      };
      stored.state = delivered;
      this.respond(stored, 'delivered', delivered.deliveredAt);
      const { state: _, ...fact } = delivered;
      this.emit('people:viewpoint-delivered', fact);
      return delivered;
    });
  }

  async responseTimes(person: PersonId): Promise<readonly ResponseTime[]> {
    return [...(this.responses.get(person) ?? [])];
  }
}

/** As pessoas em memoria: o registro e a presenca vem das portas; consentimento e horario ficam aqui. */
export function createMemoryPeople(ports: PeoplePorts): IPeople {
  return new MemoryPeople(ports);
}
