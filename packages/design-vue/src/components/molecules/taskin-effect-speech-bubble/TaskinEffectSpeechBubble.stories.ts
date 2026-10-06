import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { characterArgType } from '../../../storybook/character-control';
import TaskinEffectSpeechBubble from './TaskinEffectSpeechBubble';
import type { TaskinEffectSpeechBubbleProps } from './TaskinEffectSpeechBubble.types';

const meta = {
  title: 'Molecules/Taskin/Effects/SpeechBubble',
  component: TaskinEffectSpeechBubble,
  tags: ['design-vue'],
  argTypes: {
    character: characterArgType,
    text: {
      control: { type: 'text' },
    },
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    text: 'Oi!',
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectSpeechBubble },
    setup() {
      return { args };
    },
    template: `
      <svg width="320" height="260" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <circle cx="160" cy="124" r="4" fill="#999" />
        <TaskinEffectSpeechBubble v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectSpeechBubbleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A frase curta, no balao minimo. O ponto cinza marca a boca do Taskin. */
export const Short: Story = {
  args: {
    text: 'Oi!',
  },
};

/** A frase longa: a fonte cede, a caixa cresce para a direita e o rabicho continua na boca. */
export const LongPhrase: Story = {
  args: {
    text: 'Sidarta, a task 166 terminou e os testes passaram',
  },
};

export const NoAnimation: Story = {
  args: {
    text: 'Oi!',
    animationsEnabled: false,
  },
};
