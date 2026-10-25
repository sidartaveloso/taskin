import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TaskinEffectFly from './TaskinEffectFly';
import type { TaskinEffectFlyProps } from './TaskinEffectFly.types';

const meta = {
  title: 'Molecules/Taskin/Effects/Fly',
  component: TaskinEffectFly,
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
    components: { TaskinEffectFly },
    setup() {
      return { args };
    },
    template: `
      <svg width="200" height="200" viewBox="0 0 320 260" style="background: #f0f0f0;">
        <TaskinEffectFly v-bind="args" />
      </svg>
    `,
  }),
} satisfies Meta<TaskinEffectFlyProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "The fly of the Sapin's `catch-fly` action: an arc to the right of the head, a stop in front of the mouth, gone once the tongue catches it.",
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
        story: 'The fly hovering in front of the mouth, without animation',
      },
    },
  },
};
