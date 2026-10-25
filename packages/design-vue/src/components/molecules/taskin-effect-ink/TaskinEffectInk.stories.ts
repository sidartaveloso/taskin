import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectInk from './TaskinEffectInk';
import type { TaskinEffectInkProps } from './TaskinEffectInk.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Ink',
  component: TaskinEffectInk,
  tags: ['design-vue'],
  argTypes: {
    animationsEnabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    animationsEnabled: true,
  },
  render: (args) => ({
    components: { TaskinEffectInk },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectInk v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectInkProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "The octopus's ink cloud: grows from between the tentacles and fades away, once.",
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
        story: 'The ink cloud at full size, without animation (static)',
      },
    },
  },
};
