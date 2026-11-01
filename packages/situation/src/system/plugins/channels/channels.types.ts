import type { Brand, Instant, PersonId } from '../../../use-cases/branded';
import type { SituationPorts } from '../../../use-cases/ports.types';
import type { IPluginSituation, PluginKey } from '../../plugin.types';

/**
 * Os canais de aviso: o taskinboard, o relogio, o Discord. O aviso chega pelo
 * canal que a pessoa prefere, e so quando ela esta presente; ausente, espera.
 */
export interface IChannels extends IPluginSituation<ChannelsEvents> {
  readonly key: PluginKey<'channels'>;
  /** Os canais da pessoa, na ordem em que ela prefere. Declarar de novo substitui. */
  prefer(person: PersonId, channels: readonly ChannelName[]): Promise<void>;
  notify(person: PersonId, notice: NoticeInput): Promise<NoticeOutcome>;
  /** Tenta de novo os avisos que esperavam, para quem agora esta presente. */
  flush(): Promise<readonly NoticeSent[]>;
  /** Os avisos desta pessoa que ainda esperam. */
  pending(person: PersonId): Promise<readonly NoticeHeld[]>;
}

/** O nome de um canal: `taskinboard`, `watch`, `discord`. */
export type ChannelName = Brand<string, 'ChannelName'>;
export type NoticeId = Brand<string, 'NoticeId'>;

export interface NoticeInput {
  readonly subject: string;
  readonly body: string;
  readonly link?: string;
}

export interface Notice extends NoticeInput {
  readonly id: NoticeId;
  readonly person: PersonId;
}

export interface NoticeSent {
  readonly state: 'sent';
  readonly id: NoticeId;
  readonly person: PersonId;
  readonly channel: ChannelName;
  readonly sentAt: Instant;
}

/** A pessoa esta ausente: o aviso espera ela voltar. */
export interface NoticeHeld {
  readonly state: 'held';
  readonly id: NoticeId;
  readonly person: PersonId;
  readonly heldAt: Instant;
}

export const UNDELIVERABLE_CODES = [
  /** A pessoa nao declarou canal nenhum. */
  'no-channel',
  /** Todos os canais da pessoa recusaram o aviso. */
  'all-channels-failed',
] as const;

export type UndeliverableCode = (typeof UNDELIVERABLE_CODES)[number];

export interface NoticeUndeliverable {
  readonly state: 'undeliverable';
  readonly id: NoticeId;
  readonly person: PersonId;
  readonly reason: UndeliverableCode;
}

export type NoticeOutcome = NoticeSent | NoticeHeld | NoticeUndeliverable;

export interface IChannelSenderPort {
  /** Entrega o aviso num canal. `false` quando o canal recusou ou caiu. */
  send(channel: ChannelName, notice: Notice): Promise<boolean>;
}

/** Presenca `undefined` (nenhum canal sabe) conta como presente: o aviso tenta sair. */
export type ChannelsPorts = Pick<SituationPorts, 'clock' | 'presence'> & { readonly sender: IChannelSenderPort };

/** Os eventos levam o fato do aviso, nunca o texto dele. */
export type ChannelsEvents = {
  readonly 'channels:notice-sent': Omit<NoticeSent, 'state'>;
  readonly 'channels:notice-held': Omit<NoticeHeld, 'state'>;
  readonly 'channels:notice-undeliverable': Omit<NoticeUndeliverable, 'state'>;
};
