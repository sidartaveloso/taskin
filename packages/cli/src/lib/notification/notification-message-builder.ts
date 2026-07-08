import type {
  NotificationField,
  NotificationMessage,
} from '@opentask/taskin-types';

export class NotificationMessageBuilder {
  private title = '';
  private description = '';
  private color?: number;
  private fields: NotificationField[] = [];
  private mentions?: string[];
  private footer?: { text: string };

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setColor(color: number): this {
    this.color = color;
    return this;
  }

  addField(name: string, value: string, inline?: boolean): this {
    this.fields.push({ name, value, inline });
    return this;
  }

  setFooter(text: string): this {
    this.footer = { text };
    return this;
  }

  resolveMentions(
    names: string[],
    mapping: Record<string, string>,
  ): this {
    const resolved = names
      .map((name) => mapping[name])
      .filter((id): id is string => !!id);

    if (resolved.length > 0) {
      this.mentions = [...(this.mentions ?? []), ...resolved];
    }

    return this;
  }

  build(): NotificationMessage {
    const message: NotificationMessage = {
      title: this.title,
      description: this.description,
    };

    if (this.color !== undefined) {
      message.color = this.color;
    }

    if (this.fields.length > 0) {
      message.fields = this.fields;
    }

    if (this.mentions && this.mentions.length > 0) {
      message.mentions = this.mentions;
    }

    if (this.footer) {
      message.footer = this.footer;
    }

    return message;
  }
}
