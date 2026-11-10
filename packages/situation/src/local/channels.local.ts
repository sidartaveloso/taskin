import { MemoryChannels, type WaitingNotice } from '../memory/channels.memory';
import type {
  ChannelName,
  ChannelsPorts,
  IChannels,
  NoticeInput,
  NoticeSent,
} from '../system/plugins/channels/channels.types';
import type { PersonId } from '../use-cases/branded';
import { type FileLockOptions, withFileLock } from './access-broker.local';
import { readJsonFile, readPersonalSection, writeJsonFile, writePersonalSection } from './personal-layer';

/** Onde os canais moram. Injetados: nos testes, uma pasta temporaria. Nenhum dos dois e versionado. */
export interface LocalChannelsPaths {
  /** `~/.config/taskin/resources.json`: os canais preferidos de cada pessoa, na chave `channels`. */
  readonly personalResources: string;
  /** O `notices.json` no diretorio de estado: os avisos que esperam a pessoa voltar. */
  readonly state: string;
}

interface ChannelsState {
  sequence: number;
  waiting: WaitingNotice[];
}

/**
 * Os canais em arquivo: a mesma logica da memoria, relendo sob trava antes de
 * cada operacao e regravando depois. Um canal novo (a TV da sala, o relogio)
 * entra pelo `sender`; aqui so mora a preferencia e o que espera.
 */
class LocalChannels extends MemoryChannels {
  constructor(
    ports: ChannelsPorts,
    private readonly paths: LocalChannelsPaths,
    private readonly lock: FileLockOptions,
  ) {
    super(ports);
  }

  private load(): string {
    const preferred = readPersonalSection<ChannelName[]>(this.paths.personalResources, 'channels');
    const state = readJsonFile(this.paths.state) as Partial<ChannelsState>;
    this.sequence = state.sequence ?? 0;
    this.preferred.clear();
    for (const [person, channels] of Object.entries(preferred)) this.preferred.set(person as PersonId, channels);
    this.waiting.splice(0, this.waiting.length, ...(state.waiting ?? []));
    return this.snapshot();
  }

  private preferredJson(): Record<string, readonly ChannelName[]> {
    return Object.fromEntries(this.preferred);
  }

  private stateJson(): ChannelsState {
    return { sequence: this.sequence, waiting: [...this.waiting] };
  }

  private snapshot(): string {
    return JSON.stringify([this.preferredJson(), this.stateJson()]);
  }

  private transaction<T>(work: () => Promise<T>): Promise<T> {
    return withFileLock(`${this.paths.state}.lock`, this.lock, async () => {
      const before = this.load();
      const preferredBefore = JSON.stringify(this.preferredJson());
      const result = await work();
      if (this.snapshot() === before) return result;
      if (JSON.stringify(this.preferredJson()) !== preferredBefore) {
        writePersonalSection(this.paths.personalResources, 'channels', this.preferredJson());
      }
      writeJsonFile(this.paths.state, this.stateJson());
      return result;
    });
  }

  override prefer(person: PersonId, channels: readonly ChannelName[]): Promise<void> {
    return this.transaction(() => super.prefer(person, channels));
  }

  override notify(person: PersonId, notice: NoticeInput): ReturnType<IChannels['notify']> {
    return this.transaction(() => super.notify(person, notice));
  }

  override flush(): Promise<readonly NoticeSent[]> {
    return this.transaction(() => super.flush());
  }

  override pending(person: PersonId): ReturnType<IChannels['pending']> {
    return this.transaction(() => super.pending(person));
  }

  /** Os canais que a pessoa declarou, na ordem dela, para o `taskin channels status`. */
  preferredBy(person: PersonId): Promise<readonly ChannelName[]> {
    return this.transaction(async () => this.preferred.get(person) ?? []);
  }
}

/** O channels local, com a leitura da propria preferencia para a CLI. */
export interface ILocalChannels extends IChannels {
  preferredBy(person: PersonId): Promise<readonly ChannelName[]>;
}

export function createLocalChannels(
  ports: ChannelsPorts,
  paths: LocalChannelsPaths,
  options: FileLockOptions = {},
): ILocalChannels {
  return new LocalChannels(ports, paths, options);
}
