import { describe, expect, it } from 'vitest';
import { NotificationMessageBuilder } from './notification-message-builder.js';

describe('NotificationMessageBuilder', () => {
  it('should build message from task context', () => {
    const builder = new NotificationMessageBuilder();
    const message = builder
      .setTitle('Task #020 — Notifications')
      .setDescription('Foi finalizada por **Sidarta Veloso**')
      .setColor(5763719)
      .addField('Status', 'pending → done', true)
      .addField('Branch', 'feat/task-020', true)
      .setFooter('Taskin • task-020')
      .build();

    expect(message.title).toBe('Task #020 — Notifications');
    expect(message.description).toBe('Foi finalizada por **Sidarta Veloso**');
    expect(message.color).toBe(5763719);
    expect(message.fields).toHaveLength(2);
    expect(message.fields?.[0]).toEqual({
      name: 'Status',
      value: 'pending → done',
      inline: true,
    });
    expect(message.footer).toEqual({ text: 'Taskin • task-020' });
  });

  it('should build minimal message', () => {
    const builder = new NotificationMessageBuilder();
    const message = builder.setTitle('Task #020').setDescription('Task completed').build();

    expect(message.title).toBe('Task #020');
    expect(message.description).toBe('Task completed');
    expect(message.color).toBeUndefined();
    expect(message.fields).toBeUndefined();
    expect(message.footer).toBeUndefined();
  });

  it('should resolve mentions from mapping', () => {
    const builder = new NotificationMessageBuilder();
    const mentions = { 'Sidarta Veloso': '<@12345>', 'Joris Veloso': '<@67890>' };
    const message = builder
      .setTitle('Task #020')
      .setDescription('Task completed')
      .resolveMentions(['Sidarta Veloso', 'Joris Veloso'], mentions)
      .build();

    expect(message.mentions).toEqual(['<@12345>', '<@67890>']);
  });

  it('should skip unresolved mentions', () => {
    const builder = new NotificationMessageBuilder();
    const message = builder
      .setTitle('Task #020')
      .setDescription('Task completed')
      .resolveMentions(['Unknown User'], { 'Sidarta Veloso': '<@12345>' })
      .build();

    expect(message.mentions).toBeUndefined();
  });

  it('should include commit info when provided', () => {
    const builder = new NotificationMessageBuilder();
    const message = builder
      .setTitle('Task #020')
      .setDescription('Foi finalizada por **Sidarta Veloso**')
      .setColor(5763719)
      .addField('Status', 'pending → done', true)
      .setFooter('Taskin • task-020')
      .build();

    expect(message.fields).toHaveLength(1);
    expect(message.title).toBe('Task #020');
  });

  it('should handle empty title and description', () => {
    const builder = new NotificationMessageBuilder();
    const message = builder.setTitle('').setDescription('').build();

    expect(message.title).toBe('');
    expect(message.description).toBe('');
  });

  it('should support chained resolveMentions calls', () => {
    const builder = new NotificationMessageBuilder();
    const message = builder
      .setTitle('Task #020')
      .setDescription('Task completed')
      .resolveMentions(['Sidarta Veloso'], { 'Sidarta Veloso': '<@12345>' })
      .resolveMentions(['Joris Veloso'], { 'Joris Veloso': '<@67890>' })
      .build();

    expect(message.mentions).toEqual(['<@12345>', '<@67890>']);
  });
});
