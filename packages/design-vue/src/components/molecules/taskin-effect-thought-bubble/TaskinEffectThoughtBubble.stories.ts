import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectThoughtBubble from './TaskinEffectThoughtBubble';
import type { TaskinEffectThoughtBubbleProps } from './TaskinEffectThoughtBubble.types';

const meta = {
  title: 'Molecules/Taskin/Effects/ThoughtBubble',
  component: TaskinEffectThoughtBubble,
  tags: ['design-vue'],
  argTypes: {
    text: {
      control: { type: 'text' },
    },
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    text: '?',
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectThoughtBubble },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectThoughtBubble v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectThoughtBubbleProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const QuestionMark: Story = {
  args: {
    text: '?',
  },
};

export const Ellipsis: Story = {
  args: {
    text: '...',
  },
};

export const Default: Story = {
  args: {
    text: '?',
  },
  parameters: {
    docs: {
      description: {
        story: 'Thought bubble pulsing animation with scale effect',
      },
    },
  },
};

export const CustomText: Story = {
  args: {
    text: '!',
  },
  parameters: {
    docs: {
      description: {
        story: 'Thought bubble with custom text',
      },
    },
  },
};

export const NoAnimation: Story = {
  args: {
    text: '?',
    animationsEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Thought bubble without animation (static)',
      },
    },
  },
};

/**
 * O caso que quebrou o balao antigo: a frase do shhh e configuravel, e chamar a
 * pessoa pelo nome e o ponto. Em uma linha de 24px isto saia inteiro por fora do
 * desenho; agora a fonte cede e o balao cresce para a direita, longe da cabeca.
 */
export const LongPhrase: Story = {
  args: {
    text: 'Bruno, Shhhhhhhhhhhh...',
  },
};

/** Uma palavra unica que nao cabe em linha nenhuma so pode ser partida. */
export const SingleLongWord: Story = {
  args: {
    text: 'Shhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  },
};

/** O limite do que o balao aguenta: mais linhas, na menor fonte. */
export const VeryLongPhrase: Story = {
  args: {
    text: 'Pessoal, silencio total agora por favor que ja passou da hora',
  },
};
