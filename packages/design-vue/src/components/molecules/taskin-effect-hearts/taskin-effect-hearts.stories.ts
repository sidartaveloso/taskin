import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectHearts from './taskin-effect-hearts';
import type { TaskinEffectHeartsProps } from './taskin-effect-hearts.types';

const meta = {
  title: 'Molecules/Effects/Hearts',
  component: TaskinEffectHearts,
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectHearts },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectHearts v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectHeartsProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Hearts floating animation with scale and translation effects',
      },
    },
  },
};

export const NoAnimation: Story = {
  args: {
    animationsEnabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hearts without animation (static)',
      },
    },
  },
};
