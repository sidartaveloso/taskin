import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectThoughtBubble from './taskin-effect-thought-bubble';
import type { TaskinEffectThoughtBubbleProps } from './taskin-effect-thought-bubble.types';

const meta = {
  title: 'Molecules/Effects/ThoughtBubble',
  component: TaskinEffectThoughtBubble,
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
