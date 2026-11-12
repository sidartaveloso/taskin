import { pluginKey } from '../system/plugin.types';
import type {
  ChannelName,
  ChannelsEvents,
  ChannelsPorts,
  IChannels,
  Notice,
  NoticeHeld,
  NoticeId,
  NoticeInput,
  NoticeOutcome,
  NoticeSent,
  NoticeUndeliverable,
} from '../system/plugins/channels/channels.types';
import type { PersonId } from '../use-cases/branded';
import { MemoryPlugin } from './plugin.memory';

/** Um aviso que espera a pessoa voltar. */
export interface WaitingNotice {
  readonly held: NoticeHeld;
  readonly notice: Notice;
}

/** Os canais em memoria; a versao local estende esta e guarda o estado em arquivo. */
export class MemoryChannels extends MemoryPlugin<ChannelsEvents> implements IChannels {
  readonly key = pluginKey('channels');
  readonly name = 'Channels';
  readonly description = 'Notices through the channel each person prefers, when present';

  protected sequence = 0;
  protected readonly preferred = new Map<PersonId, readonly ChannelName[]>();
  protected readonly waiting: WaitingNotice[] = [];

  constructor(private readonly ports: ChannelsPorts) {
    super(ports.clock);
  }

  async prefer(person: PersonId, channels: readonly ChannelName[]): Promise<void> {
    this.preferred.set(person, [...channels]);
  }

  /** Tenta cada canal, na ordem da pessoa: o primeiro que aceita leva o aviso. */
  private async send(notice: Notice): Promise<NoticeSent | NoticeUndeliverable> {
    const channels = this.preferred.get(notice.person) ?? [];
    if (channels.length === 0) return this.undeliverable(notice, 'no-channel');
    for (const channel of channels) {
      if (!(await this.ports.sender.send(channel, notice))) continue;
      const sent: NoticeSent = {
        state: 'sent',
        id: notice.id,
        person: notice.person,
        channel,
        sentAt: this.clock.now(),
      };
      const { state: _, ...fact } = sent;
      this.emit('channels:notice-sent', fact);
      return sent;
    }
    return this.undeliverable(notice, 'all-channels-failed');
  }

  private undeliverable(notice: Notice, reason: NoticeUndeliverable['reason']): NoticeUndeliverable {
    this.emit('channels:notice-undeliverable', { id: notice.id, person: notice.person, reason });
    return { state: 'undeliverable', id: notice.id, person: notice.person, reason };
  }

  async notify(person: PersonId, input: NoticeInput): Promise<NoticeOutcome> {
    this.sequence += 1;
    const notice: Notice = { ...input, id: `notice-${this.sequence}` as NoticeId, person };
    if ((await this.ports.presence.present(person)) === false) {
      const held: NoticeHeld = { state: 'held', id: notice.id, person, heldAt: this.clock.now() };
      this.waiting.push({ held, notice });
      const { state: _, ...fact } = held;
      this.emit('channels:notice-held', fact);
      return held;
    }
    return this.send(notice);
  }

  async flush(): Promise<readonly NoticeSent[]> {
    const sent: NoticeSent[] = [];
    for (const entry of [...this.waiting]) {
      if ((await this.ports.presence.present(entry.notice.person)) === false) continue;
      const outcome = await this.send(entry.notice);
      if (outcome.state !== 'sent') continue;
      this.waiting.splice(this.waiting.indexOf(entry), 1);
      sent.push(outcome);
    }
    return sent;
  }

  async pending(person: PersonId): Promise<readonly NoticeHeld[]> {
    return this.waiting.filter((w) => w.held.person === person).map((w) => w.held);
  }
}

/** Os canais em memoria: a presenca e o envio vem das portas. */
export function createMemoryChannels(ports: ChannelsPorts): IChannels {
  return new MemoryChannels(ports);
}
