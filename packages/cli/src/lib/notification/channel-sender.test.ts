import {
  type ChannelName,
  createMemoryChannels,
  instant,
  type Notice,
  type NoticeId,
  type PersonId,
} from '@opentask/taskin-situation';
import type { INotificationProvider, NotificationMessage } from '@opentask/taskin-types';
import { describe, expect, it } from 'vitest';
import { createChannelSender } from './channel-sender.js';

const channel = (name: string) => name as ChannelName;
const ana = 'ana' as PersonId;
const notice: Notice = {
  id: 'n1' as NoticeId,
  person: ana,
  subject: 'Task 7 ended',
  body: 'Completed.',
  link: 'https://example.test/task/7',
};

function fake(name: string, behavior: 'ok' | 'fail' | 'throw' = 'ok') {
  const received: NotificationMessage[] = [];
  const provider: INotificationProvider = {
    name: name as INotificationProvider['name'],
    async send(message) {
      received.push(message);
      if (behavior === 'throw') throw new Error('boom https://hook.secret/x');
      return { success: behavior === 'ok', provider: name as INotificationProvider['name'], duration: 0 };
    },
  };
  return { provider, received };
}

describe('createChannelSender', () => {
  it('delivers to the provider of the same name with subject, body and link', async () => {
    const discord = fake('discord');
    const sender = createChannelSender([discord.provider]);
    expect(await sender.send(channel('discord'), notice)).toBe(true);
    const [message] = discord.received;
    expect(message?.title).toBe('Task 7 ended');
    expect(message?.description).toContain('Completed.');
    expect(JSON.stringify(message)).toContain('https://example.test/task/7');
  });

  it('refuses a channel with no provider', async () => {
    const sender = createChannelSender([fake('discord').provider]);
    expect(await sender.send(channel('tv-da-sala'), notice)).toBe(false);
  });

  it('refuses when the provider fails or throws, never throwing itself', async () => {
    const sender = createChannelSender([fake('discord', 'fail').provider, fake('telegram', 'throw').provider]);
    expect(await sender.send(channel('discord'), notice)).toBe(false);
    expect(await sender.send(channel('telegram'), notice)).toBe(false);
  });

  describe('behind the channels plugin', () => {
    const ports = (providers: INotificationProvider[]) => ({
      clock: { now: () => instant(1) },
      presence: { present: async () => undefined },
      sender: createChannelSender(providers),
    });

    it('goes to the next channel when the first has no provider', async () => {
      const console_ = fake('console');
      const channels = createMemoryChannels(ports([console_.provider]));
      await channels.prefer(ana, [channel('tv-da-sala'), channel('console')]);
      const outcome = await channels.notify(ana, { subject: 's', body: 'b' });
      expect(outcome).toMatchObject({ state: 'sent', channel: 'console' });
      expect(console_.received).toHaveLength(1);
    });

    it('is all-channels-failed when every channel refuses', async () => {
      const channels = createMemoryChannels(ports([fake('discord', 'fail').provider]));
      await channels.prefer(ana, [channel('tv-da-sala'), channel('discord')]);
      expect(await channels.notify(ana, { subject: 's', body: 'b' })).toMatchObject({
        state: 'undeliverable',
        reason: 'all-channels-failed',
      });
    });

    it('is no-channel without any channel', async () => {
      const channels = createMemoryChannels(ports([]));
      expect(await channels.notify(ana, { subject: 's', body: 'b' })).toMatchObject({
        state: 'undeliverable',
        reason: 'no-channel',
      });
    });
  });
});
