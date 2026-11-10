import { MemoryPeople, type StoredViewpoint } from '../memory/people.memory';
import type { IPeople, PeoplePorts, ViewpointOrigin } from '../system/plugins/people/people.types';
import type { ResponseTime, ViewpointConsent } from '../use-cases/actors.types';
import type { Expertise, PersonId, RepositoryId } from '../use-cases/branded';
import type { ViewpointAccepted, ViewpointAsk, ViewpointRequested } from '../use-cases/flows.types';
import { type FileLockOptions, withFileLock } from './access-broker.local';
import { readJsonFile, readPersonalSection, writeJsonFile, writePersonalSection } from './personal-layer';

/** Onde o people mora. Injetados: nos testes, uma pasta temporaria. Nenhum dos dois e versionado. */
export interface LocalPeoplePaths {
  /** `~/.config/taskin/resources.json`: o consentimento, a carga e o horario, na chave `viewpoints`. */
  readonly personalResources: string;
  /** O `viewpoints.json` no diretorio de estado: os pedidos, os convites e o tempo de resposta. */
  readonly state: string;
}

/** O que o diretorio de estado guarda dos pontos de vista. */
interface PeopleState {
  sequence: number;
  invited: Record<string, PersonId[]>;
  viewpoints: StoredViewpoint[];
  responses: Record<string, ResponseTime[]>;
}

/**
 * As pessoas em arquivo: a mesma logica da memoria, relendo os dois arquivos
 * sob trava antes de cada operacao e regravando depois, para processos da
 * mesma maquina verem os mesmos pedidos. Nada disto vai ao repositorio: quem e
 * do projeto vem do registro de pessoas, pela porta.
 */
class LocalPeople extends MemoryPeople {
  constructor(
    ports: PeoplePorts,
    private readonly paths: LocalPeoplePaths,
    private readonly lock: FileLockOptions,
  ) {
    super(ports);
  }

  private reload(): string {
    const consents = readPersonalSection<ViewpointConsent>(this.paths.personalResources, 'viewpoints');
    const state = readJsonFile(this.paths.state) as Partial<PeopleState>;
    this.sequence = state.sequence ?? 0;
    this.consents.clear();
    for (const [person, consent] of Object.entries(consents)) this.consents.set(person as PersonId, consent);
    this.invited.clear();
    for (const [repository, people] of Object.entries(state.invited ?? {})) {
      this.invited.set(repository as RepositoryId, [...people]);
    }
    this.viewpoints.clear();
    for (const stored of state.viewpoints ?? []) this.viewpoints.set(stored.requested.id, { ...stored });
    this.responses.clear();
    for (const [person, list] of Object.entries(state.responses ?? {})) {
      this.responses.set(person as PersonId, [...list]);
    }
    return this.snapshot();
  }

  private consentsJson(): Record<string, ViewpointConsent> {
    return Object.fromEntries(this.consents);
  }

  private stateJson(): PeopleState {
    return {
      sequence: this.sequence,
      invited: Object.fromEntries(this.invited),
      viewpoints: [...this.viewpoints.values()],
      responses: Object.fromEntries(this.responses),
    };
  }

  private snapshot(): string {
    return JSON.stringify([this.consentsJson(), this.stateJson()]);
  }

  /** Le, roda e, se algo mudou, grava: o consentimento na camada da pessoa, o resto no estado. */
  private transaction<T>(work: () => Promise<T>): Promise<T> {
    return withFileLock(`${this.paths.state}.lock`, this.lock, async () => {
      const before = this.reload();
      const consentsBefore = JSON.stringify(this.consentsJson());
      const result = await work();
      if (this.snapshot() === before) return result;
      if (JSON.stringify(this.consentsJson()) !== consentsBefore) {
        writePersonalSection(this.paths.personalResources, 'viewpoints', this.consentsJson());
      }
      writeJsonFile(this.paths.state, this.stateJson());
      return result;
    });
  }

  override consent(person: PersonId, consent: ViewpointConsent): Promise<void> {
    return this.transaction(() => super.consent(person, consent));
  }

  override withdrawConsent(person: PersonId): Promise<void> {
    return this.transaction(() => super.withdrawConsent(person));
  }

  override invite(repository: RepositoryId, person: PersonId): Promise<void> {
    return this.transaction(() => super.invite(repository, person));
  }

  override experts(repository: RepositoryId, expertise: Expertise): Promise<readonly PersonId[]> {
    return this.transaction(() => super.experts(repository, expertise));
  }

  override requestViewpoint(...args: [ViewpointOrigin, ViewpointAsk]): ReturnType<IPeople['requestViewpoint']> {
    return this.transaction(() => super.requestViewpoint(...args));
  }

  override follow(request: ViewpointRequested): ReturnType<IPeople['follow']> {
    return this.transaction(() => super.follow(request));
  }

  override requests(reviewer: PersonId): ReturnType<IPeople['requests']> {
    return this.transaction(() => super.requests(reviewer));
  }

  override accept(request: ViewpointRequested): ReturnType<IPeople['accept']> {
    return this.transaction(() => super.accept(request));
  }

  override decline(request: ViewpointRequested, reason: string): ReturnType<IPeople['decline']> {
    return this.transaction(() => super.decline(request, reason));
  }

  override deliver(accepted: ViewpointAccepted, answer: string): ReturnType<IPeople['deliver']> {
    return this.transaction(() => super.deliver(accepted, answer));
  }

  override responseTimes(person: PersonId): Promise<readonly ResponseTime[]> {
    return this.transaction(() => super.responseTimes(person));
  }

  /** O consentimento declarado, como a propria pessoa o ve no `taskin viewpoints status`. */
  consentOf(person: PersonId): Promise<ViewpointConsent | undefined> {
    return this.transaction(async () => this.consents.get(person));
  }
}

/** O people local, com a leitura do proprio consentimento para a CLI. */
export interface ILocalPeople extends IPeople {
  consentOf(person: PersonId): Promise<ViewpointConsent | undefined>;
}

export function createLocalPeople(
  ports: PeoplePorts,
  paths: LocalPeoplePaths,
  options: FileLockOptions = {},
): ILocalPeople {
  return new LocalPeople(ports, paths, options);
}
