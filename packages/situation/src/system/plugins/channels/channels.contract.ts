import { expect } from 'vitest';
import { ANA, BRUNO } from '../../../use-cases/scenarios';
import {
  type CreatePlugin,
  describeCases,
  lifecycleCases,
  type PluginContractCase,
  recordEvents,
} from '../../plugin.contract';
import type { ChannelName, ChannelsEvents, IChannels, NoticeInput } from './channels.types';

const TASKINBOARD = 'taskinboard' as ChannelName;
const WATCH = 'watch' as ChannelName;

const NOTICE: NoticeInput = {
  subject: 'Pedido de ponto de vista',
  body: 'O espacamento do cabecalho esta bom?',
  link: 'https://exemplo.invalid/pedido/1',
};

export const CHANNELS_CONTRACT_CASES: readonly PluginContractCase<IChannels>[] = [
  ...lifecycleCases<ChannelsEvents, IChannels>(async (channels) => {
    await channels.prefer(ANA, [TASKINBOARD]);
    await channels.notify(ANA, NOTICE);
    return 'channels:notice-sent';
  }, 'channels:notice-sent'),
  {
    name: 'presente, o aviso sai pelo canal que a pessoa prefere',
    async run(channels, ports) {
      await channels.prefer(ANA, [WATCH, TASKINBOARD]);
      ports.presence.set(ANA, true);

      const outcome = await channels.notify(ANA, NOTICE);

      expect(outcome).toMatchObject({ state: 'sent', person: ANA, channel: WATCH, sentAt: ports.clock.now() });
      expect(ports.sender.sent).toEqual([{ channel: WATCH, notice: { ...NOTICE, id: outcome.id, person: ANA } }]);
    },
  },
  {
    name: 'o canal que recusa da a vez ao proximo da lista',
    async run(channels, ports) {
      await channels.prefer(ANA, [WATCH, TASKINBOARD]);
      ports.sender.fail(WATCH);

      expect(await channels.notify(ANA, NOTICE)).toMatchObject({ state: 'sent', channel: TASKINBOARD });
    },
  },
  {
    name: 'sem presenca conhecida, o aviso tenta sair',
    async run(channels) {
      await channels.prefer(ANA, [TASKINBOARD]);
      expect((await channels.notify(ANA, NOTICE)).state).toBe('sent');
    },
  },
  {
    name: 'ausente, o aviso espera; quando ela volta, sai',
    async run(channels, ports) {
      await channels.prefer(ANA, [TASKINBOARD]);
      ports.presence.set(ANA, false);

      const held = await channels.notify(ANA, NOTICE);
      expect(held).toMatchObject({ state: 'held', person: ANA, heldAt: ports.clock.now() });
      expect(ports.sender.sent).toEqual([]);
      expect(await channels.pending(ANA)).toEqual([held]);
      expect(await channels.flush()).toEqual([]);

      ports.presence.set(ANA, true);
      const sent = await channels.flush();

      expect(sent).toMatchObject([{ state: 'sent', id: held.id, channel: TASKINBOARD }]);
      expect(await channels.pending(ANA)).toEqual([]);
    },
  },
  {
    name: 'sem canal declarado, ou com todos recusando, o aviso nao tem como sair e diz por que',
    async run(channels, ports) {
      expect(await channels.notify(BRUNO, NOTICE)).toMatchObject({ state: 'undeliverable', reason: 'no-channel' });

      await channels.prefer(ANA, [WATCH]);
      ports.sender.fail(WATCH);
      expect(await channels.notify(ANA, NOTICE)).toMatchObject({
        state: 'undeliverable',
        reason: 'all-channels-failed',
      });
    },
  },
  {
    name: 'o aviso de uma pessoa nunca chega a outra',
    async run(channels, ports) {
      await channels.prefer(ANA, [TASKINBOARD]);
      await channels.prefer(BRUNO, [TASKINBOARD]);
      ports.presence.set(BRUNO, false);

      await channels.notify(BRUNO, NOTICE);
      await channels.notify(ANA, NOTICE);
      await channels.flush();

      expect(ports.sender.sent.map((s) => s.notice.person)).toEqual([ANA]);
      expect((await channels.pending(ANA)).length).toBe(0);
      expect((await channels.pending(BRUNO)).length).toBe(1);
    },
  },
  {
    name: 'os eventos levam o fato do aviso, nunca o texto',
    async run(channels, ports) {
      await channels.start();
      const seen = recordEvents(channels, ['channels:notice-sent', 'channels:notice-held']);
      await channels.prefer(ANA, [TASKINBOARD]);
      await channels.notify(ANA, NOTICE);
      ports.presence.set(ANA, false);
      await channels.notify(ANA, NOTICE);

      expect(seen.map((e) => e.type)).toEqual(['channels:notice-sent', 'channels:notice-held']);
      expect(JSON.stringify(seen)).not.toContain(NOTICE.body);
    },
  },
];

export function describeChannelsContract(label: string, create: CreatePlugin<IChannels>): void {
  describeCases(label, create, CHANNELS_CONTRACT_CASES);
}
